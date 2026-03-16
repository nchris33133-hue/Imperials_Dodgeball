const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { validateEmail } = require('../lib/validation');
const { createAccessToken, generateRefreshToken, hashRefreshToken, setAccessTokenCookie, setRefreshTokenCookie, preHashPassword, REFRESH_TOKEN_DAYS } = require('../lib/auth');
const { checkRateLimit, recordAttempt, clearAttempts } = require('../lib/rate-limit');

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, remember_me = false } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
    }

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr, code: 'VALIDATION_ERROR' });

    const normalizedEmail = email.trim().toLowerCase();

    const rateCheck = await checkRateLimit(normalizedEmail);
    if (rateCheck.limited) {
      return res.status(429).json({
        error: `Too many login attempts. Try again in ${Math.ceil(rateCheck.retryAfter / 60)} minutes.`,
        code: 'RATE_LIMITED',
        retry_after: rateCheck.retryAfter
      });
    }

    const sql = getDb();
    const users = await sql`
      SELECT id, email, password_hash, display_name, ranking_player_name, is_active
      FROM users WHERE email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      await recordAttempt(normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const preHashed = preHashPassword(password);
    const valid = await bcrypt.compare(preHashed, user.password_hash);
    if (!valid) {
      await recordAttempt(normalizedEmail);
      console.log(`AUTH: login failed user=${user.id}`);
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    await clearAttempts(normalizedEmail);
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    const accessToken = createAccessToken(user);
    setAccessTokenCookie(res, accessToken);

    if (remember_me) {
      const refreshToken = generateRefreshToken();
      const refreshHash = hashRefreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

      await sql`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id}, ${refreshHash}, ${expiresAt})
      `;
      setRefreshTokenCookie(res, refreshToken);
    }

    console.log(`AUTH: login success user=${user.id}`);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        ranking_player_name: user.ranking_player_name
      }
    });
  } catch (err) {
    console.error('AUTH: login error', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.', code: 'SERVER_ERROR' });
  }
};
