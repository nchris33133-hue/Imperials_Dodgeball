const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { requireMember } = require('../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = requireMember(req, res);
    if (!payload) return;

    const sql = getDb();
    const users = await sql`
      SELECT id, email, display_name, ranking_player_name, created_at
      FROM users WHERE id = ${payload.sub} AND is_active = true
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found', code: 'INVALID_TOKEN' });
    }

    const user = users[0];
    return res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        ranking_player_name: user.ranking_player_name
      }
    });
  } catch (err) {
    console.error('AUTH: verify error', err.message);
    return res.status(500).json({ error: 'Verification failed', code: 'SERVER_ERROR' });
  }
};
