const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { validateEmail, validatePassword, validateDisplayName, sanitizeHtml } = require('../lib/validation');
const { createAccessToken, generateRefreshToken, hashRefreshToken, setAccessTokenCookie, setRefreshTokenCookie, preHashPassword, REFRESH_TOKEN_DAYS } = require('../lib/auth');
const { checkRateLimit, recordAttempt } = require('../lib/rate-limit');

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, display_name } = req.body || {};

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr, code: 'VALIDATION_ERROR' });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr, code: 'WEAK_PASSWORD' });

    const nameErr = validateDisplayName(display_name);
    if (nameErr) return res.status(400).json({ error: nameErr, code: 'VALIDATION_ERROR' });

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = sanitizeHtml(display_name.trim());

    const rateCheck = await checkRateLimit(normalizedEmail);
    if (rateCheck.limited) {
      return res.status(429).json({
        error: 'Too many requests. Try again later.',
        code: 'RATE_LIMITED',
        retry_after: rateCheck.retryAfter
      });
    }

    const preHashed = preHashPassword(password);
    const passwordHash = await bcrypt.hash(preHashed, 12);

    const sql = getDb();
    let rows;
    try {
      rows = await sql`
        INSERT INTO users (email, password_hash, display_name)
        VALUES (${normalizedEmail}, ${passwordHash}, ${trimmedName})
        RETURNING id, email, display_name, created_at
      `;
    } catch (err) {
      if (err.message && (err.message.includes('unique') || err.message.includes('duplicate'))) {
        return res.status(409).json({
          error: 'An account with this email already exists',
          code: 'EMAIL_EXISTS'
        });
      }
      throw err;
    }

    const user = rows[0];

    const accessToken = createAccessToken(user);
    setAccessTokenCookie(res, accessToken);

    const refreshToken = generateRefreshToken();
    const refreshHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${refreshHash}, ${expiresAt})
    `;
    setRefreshTokenCookie(res, refreshToken);

    console.log(`AUTH: register success user=${user.id}`);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    });
  } catch (err) {
    console.error('AUTH: register error', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.', code: 'SERVER_ERROR' });
  }
};
