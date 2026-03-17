const jwt = require('jsonwebtoken');
const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { DEFAULT_PLAYERS } = require('../lib/defaults');

function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

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
    } catch (err) {
      console.error('Rankings read error:', err.message);
    }
    return res.status(200).json(DEFAULT_PLAYERS);
  }

  if (req.method === 'POST') {
    if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
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
    } catch (err) {
      console.error('Rankings write error:', err.message);
      return res.status(500).json({ error: 'Failed to save rankings', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
