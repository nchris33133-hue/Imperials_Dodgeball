/* ═══════════════════════════════════════
   RANKINGS DATA — Vienna Imperials
   Player data, localStorage sync, API persistence
═══════════════════════════════════════ */

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

let players  = JSON.parse(localStorage.getItem('vi_players') || 'null') || DEFAULT_PLAYERS.map(p => ({ ...p }));
let nextId   = Math.max(0, ...players.map(p => p.id)) + 1;

async function loadPlayersFromAPI() {
  try {
    const res = await fetch('/api/rankings');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        players = data;
        nextId = Math.max(0, ...players.map(p => p.id)) + 1;
      }
    }
  } catch (e) { /* fall back to localStorage */ }
}

let filter   = 'all';
let sortKey  = 'points';
let editId   = null;
let deleteId = null;
let rankVisible = 25;

function save() {
  localStorage.setItem('vi_players', JSON.stringify(players));
  if (typeof isAdmin === 'function' && isAdmin()) {
    fetch('/api/rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify(players)
    }).catch(err => console.error('Rankings save failed:', err));
  }
}
