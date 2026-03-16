const jwt = require('jsonwebtoken');
const { getDb } = require('./lib/db');
const { setCors } = require('./lib/cors');

const DEFAULT_PLAYERS = [
  { id:1,  name:'Sean Aczel',          gender:'male',   tier:'silver',   points:17.5, gain:2.5,  played:7, streak:7, ref:2,  change:0  },
  { id:2,  name:'Apachiiblu Nicholls', gender:'male',   tier:'silver',   points:15.0, gain:2.5,  played:7, streak:7, ref:5,  change:0  },
  { id:3,  name:'Jeremy Sang',         gender:'male',   tier:'silver',   points:14.0, gain:2.5,  played:6, streak:5, ref:3,  change:0  },
  { id:4,  name:'James Morris',        gender:'male',   tier:'silver',   points:14.0, gain:null, played:6, streak:6, ref:2,  change:0  },
  { id:5,  name:'Mark Gillam',         gender:'male',   tier:'silver',   points:12.5, gain:1.0,  played:7, streak:7, ref:2,  change:0  },
  { id:6,  name:'Justin Oh',           gender:'male',   tier:'silver',   points:11.5, gain:2.5,  played:6, streak:6, ref:1,  change:0  },
  { id:7,  name:'Isaac Lewis',         gender:'male',   tier:'silver',   points:11.0, gain:2.5,  played:6, streak:6, ref:1,  change:0  },
  { id:8,  name:'Emma Bauer',          gender:'female', tier:'gold',     points:10.5, gain:2.0,  played:5, streak:4, ref:3,  change:1  },
  { id:9,  name:'Lena Hofer',          gender:'female', tier:'silver',   points:9.0,  gain:1.5,  played:5, streak:3, ref:2,  change:0  },
  { id:10, name:'Tobias Winkler',      gender:'male',   tier:'bronze',   points:8.5,  gain:1.0,  played:4, streak:2, ref:1,  change:-1 },
];

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
    if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });
    const players = req.body;
    if (!Array.isArray(players)) return res.status(400).json({ error: 'Expected array' });

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
      return res.status(500).json({ error: 'Failed to save rankings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
