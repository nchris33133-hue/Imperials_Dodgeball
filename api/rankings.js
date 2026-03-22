const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { requireAdmin } = require('../lib/auth');
const { DEFAULT_PLAYERS } = require('../lib/defaults');
const { requireJSON } = require('../lib/validation');

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
      console.error('Failed to load rankings from DB:', err);
    }
    return res.status(200).json(DEFAULT_PLAYERS);
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    if (!requireJSON(req)) return res.status(415).json({ error: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' });

    const players = req.body;
    if (!Array.isArray(players)) return res.status(400).json({ error: 'Expected array', code: 'VALIDATION_ERROR' });
    if (players.length > 500) return res.status(400).json({ error: 'Too many players (max 500)', code: 'VALIDATION_ERROR' });

    const VALID_TIERS = ['bronze', 'silver', 'gold', 'platinum'];
    const VALID_GENDERS = ['male', 'female', ''];
    const NUMERIC_FIELDS = ['points', 'gain', 'played', 'streak', 'bp', 'change'];
    for (const p of players) {
      if (typeof p !== 'object' || p === null) return res.status(400).json({ error: 'Each entry must be an object', code: 'VALIDATION_ERROR' });
      if (p.tier && !VALID_TIERS.includes(p.tier)) return res.status(400).json({ error: `Invalid tier "${p.tier}". Must be one of: ${VALID_TIERS.join(', ')}`, code: 'VALIDATION_ERROR' });
      if (p.name && typeof p.name === 'string' && p.name.length > 100) return res.status(400).json({ error: 'Player name too long (max 100 chars)', code: 'VALIDATION_ERROR' });
      if (p.id !== undefined && (typeof p.id !== 'number' || p.id <= 0 || !Number.isFinite(p.id))) {
        return res.status(400).json({ error: `Invalid id "${p.id}". Must be a positive number`, code: 'VALIDATION_ERROR' });
      }
      for (const field of NUMERIC_FIELDS) {
        if (p[field] !== undefined && (typeof p[field] !== 'number' || !Number.isFinite(p[field]))) {
          return res.status(400).json({ error: `Invalid ${field} "${p[field]}". Must be a number`, code: 'VALIDATION_ERROR' });
        }
      }
      if (p.gender !== undefined && !VALID_GENDERS.includes(p.gender)) {
        return res.status(400).json({ error: `Invalid gender "${p.gender}". Must be one of: male, female, or empty string`, code: 'VALIDATION_ERROR' });
      }
    }

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
      console.error('Failed to save rankings:', err);
      return res.status(500).json({ error: 'Failed to save rankings', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
