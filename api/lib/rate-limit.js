const crypto = require('crypto');
const { getDb } = require('./db');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function checkRateLimit(email) {
  const sql = getDb();
  const emailHash = hashEmail(email);
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  const rows = await sql`
    SELECT attempt_count, window_start FROM login_attempts
    WHERE email_hash = ${emailHash} AND window_start > ${windowStart}
  `;

  if (rows.length > 0 && rows[0].attempt_count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil(
      (new Date(rows[0].window_start).getTime() + WINDOW_MS - Date.now()) / 1000
    );
    return { limited: true, retryAfter: Math.max(retryAfter, 1) };
  }

  return { limited: false, retryAfter: 0 };
}

async function recordAttempt(email) {
  const sql = getDb();
  const emailHash = hashEmail(email);

  await sql`
    INSERT INTO login_attempts (email_hash, attempt_count, window_start)
    VALUES (${emailHash}, 1, NOW())
    ON CONFLICT (email_hash) DO UPDATE
    SET attempt_count = CASE
      WHEN login_attempts.window_start < NOW() - INTERVAL '15 minutes'
      THEN 1
      ELSE login_attempts.attempt_count + 1
    END,
    window_start = CASE
      WHEN login_attempts.window_start < NOW() - INTERVAL '15 minutes'
      THEN NOW()
      ELSE login_attempts.window_start
    END
  `;
}

async function clearAttempts(email) {
  const sql = getDb();
  const emailHash = hashEmail(email);
  await sql`DELETE FROM login_attempts WHERE email_hash = ${emailHash}`;
}

module.exports = { checkRateLimit, recordAttempt, clearAttempts };
