const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { requireAdmin } = require('../lib/auth');
const { DEFAULT_PLAYERS } = require('../lib/defaults');

module.exports = async (req, res) => {
  setCors(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const sql = getDb();
      const rows = await sql`SELECT data FROM rankings_data WHERE id = 1`;
      if (rows.length > 0 && rows[0].data) {
        return res.status(200).json(rows[0].data);
      }
    } catch {
      // Fall through to default players
    }
    return res.status(200).json(DEFAULT_PLAYERS);
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const players = req.body;
    if (!Array.isArray(players)) return res.status(400).json({ error: 'Expected array', code: 'VALIDATION_ERROR' });

    try {
      const sql = getDb();
      const jsonData = JSON.stringify(players);
      await sql`
        INSERT INTO rankings_data (id, data, updated_at)
        VALUES (1, ${jsonData}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET data = ${jsonData}::jsonb, updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Failed to save rankings', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
