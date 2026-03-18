/* ═══════════════════════════════════════
   RANKINGS IMPORT/EXPORT — Vienna Imperials
   Excel/CSV import, CSV export, file handling
═══════════════════════════════════════ */

let importData = [], importMode = 'replace';
let xlsxLoaded = false;

async function loadXLSX() {
  if (xlsxLoaded || typeof XLSX !== 'undefined') { xlsxLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
    s.onload = () => { xlsxLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function openImport() {
  importData = []; importMode = 'replace';
  document.getElementById('importPreviewSection').style.display = 'none';
  document.getElementById('importConfirmBtn').style.display = 'none';
  document.getElementById('fileInput').value = '';
  document.getElementById('modeReplace').classList.add('selected');
  document.getElementById('modeMerge').classList.remove('selected');
  document.getElementById('importBackdrop').classList.add('open');
  loadXLSX().catch(() => toast('Failed to load Excel library', 'danger'));
}
function closeImport() { document.getElementById('importBackdrop').classList.remove('open'); }
function importBdClick(e) { if (e.target === document.getElementById('importBackdrop')) closeImport(); }

function setImportMode(mode) {
  importMode = mode;
  document.getElementById('modeReplace').classList.toggle('selected', mode === 'replace');
  document.getElementById('modeMerge').classList.toggle('selected', mode === 'merge');
}

// ── Drag & drop
const dz = document.getElementById('dropZone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragging'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragging'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragging'); const f = e.dataTransfer?.files?.[0]; if (f) processFile(f); });

function handleFileSelect(e) { const f = e.target.files?.[0]; if (f) processFile(f); }

function processFile(file) {
  const reader = new FileReader();
  const isCSV = file.name.toLowerCase().endsWith('.csv');
  reader.onload = ev => {
    try {
      let rows;
      if (isCSV) { rows = parseCSV(ev.target.result); }
      else { const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); }
      importData = parseRows(rows);
      renderPreview(importData);
    } catch (err) { toast('Could not read file: ' + err.message, 'danger'); }
  };
  isCSV ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
}

function parseCSV(text) {
  return text.trim().split('\n').map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
}

function parseRows(rows) {
  if (rows.length < 2) return [];
  const header = rows[0].map(h => String(h).toLowerCase().trim());
  const col = k => {
    const variants = {
      name: ['name', 'player', 'full name'],
      points: ['points', 'pts', 'score'],
      gain: ['gain', 'gain pts', 'last gain'],
      played: ['played', 'games', 'games played', 'gp'],
      streak: ['streak', 'win streak'],
      ref: ['ref', 'referral', 'referrals'],
      gender: ['gender', 'sex'],
      tier: ['tier', 'rank tier', 'level'],
      change: ['change', 'rank change', 'delta']
    };
    const alts = variants[k] || [k];
    for (const a of alts) { const i = header.indexOf(a); if (i !== -1) return i; }
    return -1;
  };
  const ni = col('name'), pi = col('points');
  if (ni === -1 || pi === -1) { toast('Missing required columns: Name and Points', 'danger'); return []; }
  return rows.slice(1).filter(r => r[ni] && String(r[ni]).trim()).map((r, idx) => {
    const g = String(r[col('gain')] ?? '').trim();
    return {
      id: nextId + idx,
      name: String(r[ni]).trim(),
      points: parseFloat(r[pi]) || 0,
      gain: g === '' || g === '-' || g === 'null' ? null : parseFloat(g),
      played: parseInt(r[col('played')]) || 0,
      streak: parseInt(r[col('streak')]) || 0,
      ref: parseInt(r[col('ref')]) || 0,
      gender: (['male', 'female'].includes(String(r[col('gender')] || '').toLowerCase())) ? String(r[col('gender')]).toLowerCase() : 'male',
      tier: (['bronze', 'silver', 'gold', 'platinum'].includes(String(r[col('tier')] || '').toLowerCase())) ? String(r[col('tier')]).toLowerCase() : 'silver',
      change: parseInt(r[col('change')]) || 0
    };
  });
}

function renderPreview(data) {
  if (!data.length) { toast('No valid rows found in file', 'danger'); return; }
  document.getElementById('importPreviewSection').style.display = 'block';
  document.getElementById('importConfirmBtn').style.display = 'inline-flex';
  document.getElementById('importCount').innerHTML = `<strong>${data.length}</strong> player${data.length !== 1 ? 's' : ''} ready to import`;
  document.getElementById('previewTable').innerHTML = `<table><thead><tr><th>Name</th><th>Points</th><th>Gain</th><th>Played</th><th>Streak</th><th>REF</th><th>Gender</th><th>Tier</th></tr></thead><tbody>${data.slice(0, 8).map(p => `<tr><td>${esc(p.name)}</td><td>${p.points.toFixed(1)}</td><td>${p.gain == null ? '—' : (p.gain >= 0 ? '+' : '') + p.gain.toFixed(1)}</td><td>${p.played}</td><td>${p.streak}</td><td>${p.ref}</td><td>${p.gender}</td><td>${p.tier}</td></tr>`).join('')}${data.length > 8 ? `<tr><td colspan="8" style="color:rgba(244,247,255,0.3);font-size:0.78rem;padding:6px 12px;">…and ${data.length - 8} more rows</td></tr>` : ''}</tbody></table>`;
}

function confirmImport() {
  if (!importData.length) return;
  if (importMode === 'replace') {
    players = importData.map((p, i) => ({ ...p, id: i + 1 }));
    nextId = players.length + 1;
    toast(`Replaced with ${players.length} players from file`, 'info');
  } else {
    let added = 0, updated = 0;
    importData.forEach(imp => {
      const idx = players.findIndex(p => p.name.toLowerCase() === imp.name.toLowerCase());
      if (idx !== -1) { players[idx] = { ...players[idx], ...imp, id: players[idx].id }; updated++; }
      else { players.push({ ...imp, id: nextId++ }); added++; }
    });
    toast(`Updated ${updated}, added ${added} players`, 'info');
  }
  save(); render(); closeImport();
}

// ── Export CSV
function exportCSV() {
  const header = ['Name', 'Points', 'Gain', 'Played', 'Streak', 'REF', 'Gender', 'Tier', 'Change'];
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const rows = sorted.map(p => [p.name, p.points, p.gain ?? '', p.played, p.streak, p.ref, p.gender, p.tier, p.change]);
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'imperials-rankings.csv' });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('Rankings exported as CSV', 'info');
}
