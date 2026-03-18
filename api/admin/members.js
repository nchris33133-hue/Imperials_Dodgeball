const { getDb } = require('../../lib/db');
const { setCors } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { isValidUuid } = require('../../lib/validation');

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
      console.error('Failed to fetch members:', err);
      return res.status(500).json({ error: 'Failed to fetch members', code: 'SERVER_ERROR' });
    }
  }

  // PATCH: approve or reject a member
  if (req.method === 'PATCH') {
    const { user_id, action, ranking_player_name } = req.body || {};
    if (!user_id || !action) {
      return res.status(400).json({ error: 'user_id and action are required', code: 'VALIDATION_ERROR' });
    }
    if (!isValidUuid(user_id)) {
      return res.status(400).json({ error: 'Invalid user_id format', code: 'VALIDATION_ERROR' });
    }
    if (!['approve', 'reject', 'link'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve", "reject", or "link"', code: 'VALIDATION_ERROR' });
    }
    try {
      if (action === 'link') {
        await sql`
          UPDATE users
          SET ranking_player_name = ${ranking_player_name || null}
          WHERE id = ${user_id}
        `;
      } else if (action === 'approve') {
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
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Member action failed:', err);
      return res.status(500).json({ error: 'Action failed', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
