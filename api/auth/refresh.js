const { getDb } = require('../../lib/db');
const { setCors } = require('../../lib/cors');
const { extractTokenFromCookie, createAccessToken, generateRefreshToken, hashRefreshToken, setAccessTokenCookie, setRefreshTokenCookie, REFRESH_TOKEN_DAYS } = require('../../lib/auth');
const { checkRateLimit, recordAttempt, clearAttempts } = require('../../lib/rate-limit');

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const refreshToken = extractTokenFromCookie(req, 'refresh_token');
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token', code: 'NO_REFRESH_TOKEN' });
    }

    // Rate limit refresh attempts by token hash to prevent brute-force
    const tokenHash = hashRefreshToken(refreshToken);
    const rateKey = `refresh_${tokenHash.slice(0, 16)}`;
    const rateCheck = await checkRateLimit(rateKey);
    if (rateCheck.limited) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.', code: 'RATE_LIMITED', retryAfter: rateCheck.retryAfter });
    }

    const sql = getDb();

    const rows = await sql`
      SELECT rt.id AS token_id, rt.user_id, u.email, u.display_name, u.ranking_player_name, u.is_active
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ${tokenHash} AND rt.expires_at > NOW()
    `;

    if (rows.length === 0) {
      await recordAttempt(rateKey);
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    const row = rows[0];

    if (!row.is_active) {
      await sql`DELETE FROM refresh_tokens WHERE user_id = ${row.user_id}`;
      return res.status(401).json({ error: 'Account deactivated', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Rotate: delete old, create new
    await sql`DELETE FROM refresh_tokens WHERE id = ${row.token_id}`;

    const newRefreshToken = generateRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (${row.user_id}, ${newHash}, ${expiresAt})
    `;

    const accessToken = createAccessToken({ id: row.user_id });
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    await clearAttempts(rateKey);

    return res.status(200).json({
      user: {
        id: row.user_id,
        email: row.email,
        display_name: row.display_name,
        ranking_player_name: row.ranking_player_name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token refresh failed', code: 'SERVER_ERROR' });
  }
};
