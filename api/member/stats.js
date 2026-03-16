const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { requireMember } = require('../lib/auth');

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
      return res.status(401).json({ error: 'User not found', code: 'UNAUTHORIZED' });
    }

    const user = users[0];

    // Fetch rankings (from DB or fallback)
    let rankings = DEFAULT_PLAYERS;
    try {
      const rankRows = await sql`SELECT data FROM rankings_data WHERE id = 1`;
      if (rankRows.length > 0 && rankRows[0].data) {
        rankings = rankRows[0].data;
      }
    } catch {
      // Fall back to defaults
    }

    // Match user to their ranking entry
    let stats = null;
    if (user.ranking_player_name) {
      const sorted = [...rankings].sort((a, b) => (b.points || 0) - (a.points || 0));
      const idx = sorted.findIndex(
        p => p.name && p.name.toLowerCase() === user.ranking_player_name.toLowerCase()
      );
      if (idx !== -1) {
        stats = { ...sorted[idx], rank: idx + 1 };
      }
    }

    return res.status(200).json({
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        member_since: user.created_at
      },
      stats,
      rankings
    });
  } catch (err) {
    console.error('MEMBER: stats error', err.message);
    return res.status(500).json({ error: 'Could not load stats', code: 'SERVER_ERROR' });
  }
};
