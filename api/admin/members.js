const { getDb } = require('../../lib/db');
const { setCors } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res, 'GET, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const sql = getDb();

  // GET: list members by status
  if (req.method === 'GET') {
    const status = req.query.status || 'pending';
    try {
      let members;
      if (status === 'all') {
        members = await sql`
          SELECT id, email, display_name, ranking_player_name, is_active, status, created_at
          FROM users ORDER BY created_at DESC
        `;
      } else {
        members = await sql`
          SELECT id, email, display_name, ranking_player_name, is_active, status, created_at
          FROM users WHERE status = ${status} ORDER BY created_at ASC
        `;
      }
      return res.status(200).json({ members });
    } catch (err) {
      console.error('ADMIN: list members error', err.message);
      return res.status(500).json({ error: 'Failed to fetch members', code: 'SERVER_ERROR' });
    }
  }

  // PATCH: approve or reject a member
  if (req.method === 'PATCH') {
    const { user_id, action, ranking_player_name } = req.body || {};
    if (!user_id || !action) {
      return res.status(400).json({ error: 'user_id and action are required', code: 'VALIDATION_ERROR' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"', code: 'VALIDATION_ERROR' });
    }
    try {
      if (action === 'approve') {
        await sql`
          UPDATE users
          SET is_active = true,
              status = 'approved',
              ranking_player_name = ${ranking_player_name || null}
          WHERE id = ${user_id}
        `;
      } else {
        await sql`
          UPDATE users SET is_active = false, status = 'rejected'
          WHERE id = ${user_id}
        `;
      }
      console.log(`ADMIN: ${action} user=${user_id}`);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('ADMIN: approve/reject error', err.message);
      return res.status(500).json({ error: 'Action failed', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
