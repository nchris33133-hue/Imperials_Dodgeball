const { getDb } = require('../../lib/db');
const { setCors } = require('../../lib/cors');
const { extractTokenFromCookie, hashRefreshToken, clearAuthCookies } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const refreshToken = extractTokenFromCookie(req, 'refresh_token');

    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const sql = getDb();
      await sql`DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}`;
    }

    clearAuthCookies(res);
    return res.status(200).json({ success: true });
  } catch {
    clearAuthCookies(res);
    return res.status(200).json({ success: true });
  }
};
