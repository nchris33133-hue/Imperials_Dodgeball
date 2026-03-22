const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { validateEmail, requireJSON } = require('../lib/validation');

function sanitizeField(v) {
  let str = String(v).replace(/"/g, '""');
  // Prevent CSV injection: prefix formula-like values
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

async function ensureSignupsTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS signups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(320) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'join',
      level VARCHAR(50),
      source VARCHAR(200),
      email_consent BOOLEAN DEFAULT FALSE,
      consent_timestamp TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function ensureEmailLogTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS email_log (
      id SERIAL PRIMARY KEY,
      recipient_email VARCHAR(320) NOT NULL,
      email_type VARCHAR(50) NOT NULL,
      subject VARCHAR(500),
      status VARCHAR(20) NOT NULL,
      resend_id VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function sendContactEmail({ name, email, message }) {
  const { sendEmail } = require('../lib/email');
  const { contactMessage } = require('../lib/email-templates');
  const template = contactMessage({ name, email, message });

  await sendEmail({
    to: 'imperialsdodgeball@gmail.com',
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: email,
    cc: null
  });
}

let _tableReady = null;
let _emailLogReady = null;

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  if (!requireJSON(req)) return res.status(415).json({ error: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' });

  const { type = 'join' } = req.body || {};

  // ── Contact message flow ──
  if (type === 'contact') {
    let { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required', code: 'VALIDATION_ERROR' });

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) return res.status(400).json({ error: emailError, code: 'VALIDATION_ERROR' });

    const trimmedName = String(name).trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) return res.status(400).json({ error: 'Invalid name', code: 'VALIDATION_ERROR' });

    const trimmedMessage = String(message).trim();
    if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) return res.status(400).json({ error: 'Message must be between 10 and 2000 characters', code: 'VALIDATION_ERROR' });

    try {
      const sql = getDb();

      // Rate limit: max 3 contact messages per email per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const rateLimitRows = await sql`
        SELECT COUNT(*)::int AS cnt FROM contact_messages
        WHERE email = ${trimmedEmail} AND created_at > ${oneHourAgo}
      `;
      if (rateLimitRows[0]?.cnt >= 3) {
        return res.status(429).json({ error: 'Too many messages. Please try again later.', code: 'RATE_LIMITED' });
      }

      // Save to DB
      await sql`
        INSERT INTO contact_messages (name, email, message)
        VALUES (${sanitizeField(trimmedName)}, ${trimmedEmail}, ${trimmedMessage})
      `;

      // Send email to club
      try {
        await sendContactEmail({ name: trimmedName, email: trimmedEmail, message: trimmedMessage });
      } catch (emailErr) {
        console.error('Failed to send contact email:', emailErr.message);
      }

      return res.status(200).json({ success: true, message: 'Message sent! / Nachricht gesendet!' });
    } catch (err) {
      // Auto-create table on first use
      if (err.message?.includes('contact_messages')) {
        try {
          const sql = getDb();
          await sql`
            CREATE TABLE IF NOT EXISTS contact_messages (
              id SERIAL PRIMARY KEY,
              name VARCHAR(200) NOT NULL,
              email VARCHAR(320) NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
          `;
          // Retry the insert
          await sql`
            INSERT INTO contact_messages (name, email, message)
            VALUES (${sanitizeField(String(name).trim())}, ${trimmedEmail}, ${trimmedMessage})
          `;
          // Send email (was missing from retry path)
          try {
            await sendContactEmail({ name: trimmedName, email: trimmedEmail, message: trimmedMessage });
          } catch (emailErr) {
            console.error('Failed to send contact email on retry:', emailErr.message);
          }
          return res.status(200).json({ success: true, message: 'Message sent! / Nachricht gesendet!' });
        } catch (retryErr) {
          console.error('Contact retry failed:', retryErr);
        }
      }
      console.error('Contact form error:', err);
      return res.status(500).json({ error: 'Could not send message', code: 'SERVER_ERROR' });
    }
  }

  // ── Join signup flow ──
  let { name, email, level = '', source = '' } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required', code: 'VALIDATION_ERROR' });
  if (typeof level !== 'string') level = '';
  if (typeof source !== 'string') source = '';
  level = level.slice(0, 100);
  source = source.slice(0, 200);

  // Validate email format
  const trimmedEmail = String(email).trim().toLowerCase();
  const emailError = validateEmail(trimmedEmail);
  if (emailError) {
    return res.status(400).json({ error: emailError, code: 'VALIDATION_ERROR' });
  }

  // Validate name length
  const trimmedName = String(name).trim();
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return res.status(400).json({ error: 'Invalid name', code: 'VALIDATION_ERROR' });
  }

  // Sanitize fields to prevent injection
  const safeName = sanitizeField(trimmedName);
  const safeLevel = sanitizeField(level);
  const safeSource = sanitizeField(source);

  try {
    // Ensure the signups table exists (cached after first call)
    if (!_tableReady) {
      _tableReady = ensureSignupsTable();
    }
    await _tableReady;

    const sql = getDb();

    // Rate limit: max 5 submissions per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const rateLimitRows = await sql`
      SELECT COUNT(*)::int AS cnt FROM signups
      WHERE email = ${trimmedEmail} AND created_at > ${oneHourAgo}
    `;
    if (rateLimitRows[0].cnt >= 5) {
      return res.status(429).json({
        error: 'Too many signup attempts. Please try again later.',
        code: 'RATE_LIMITED'
      });
    }

    // Insert signup into database
    await sql`
      INSERT INTO signups (name, email, type, level, source)
      VALUES (${safeName}, ${trimmedEmail}, ${type}, ${safeLevel || null}, ${safeSource || null})
    `;

    // Send confirmation email (non-blocking — failure should not break signup)
    try {
      const { sendEmail } = require('../lib/email');
      const { signupConfirmation } = require('../lib/email-templates');
      const template = signupConfirmation({ name: trimmedName });

      const result = await sendEmail({
        to: trimmedEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      // Log the email for GDPR audit trail
      if (!_emailLogReady) _emailLogReady = ensureEmailLogTable();
      await _emailLogReady;
      await sql`
        INSERT INTO email_log (recipient_email, email_type, subject, status, resend_id)
        VALUES (${trimmedEmail}, 'signup_confirm',
                ${template.subject}, 'sent', ${result?.data?.id || null})
      `.catch(() => {}); // Don't fail if logging fails
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr.message);
      // Email failure is non-critical — signup still succeeds
    }

    const message = "Thanks for signing up! We'll be in touch. / Danke! Wir melden uns bald.";
    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error('Could not save signup:', err);
    return res.status(500).json({ error: 'Could not save signup', code: 'SERVER_ERROR' });
  }
};
