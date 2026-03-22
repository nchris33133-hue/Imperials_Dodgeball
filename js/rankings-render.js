/* ═══════════════════════════════════════
   RANKINGS RENDER — Vienna Imperials
   Stats bar, leaderboard table, filtering, sorting, pagination
═══════════════════════════════════════ */

function renderStats() {
  const total  = players.length;
  const males  = players.filter(p => p.gender === 'male').length;
  const females = players.filter(p => p.gender === 'female').length;
  const avgPts = total ? (players.reduce((s, p) => s + p.points, 0) / total).toFixed(1) : '—';
  document.getElementById('statsBar').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Players</div><div class="stat-value">${total}</div><div class="stat-sub">Registered athletes</div></div>
    <div class="stat-card"><div class="stat-label">Male</div><div class="stat-value">${males}</div><div class="stat-sub">Active this season</div></div>
    <div class="stat-card"><div class="stat-label">Female</div><div class="stat-value">${females}</div><div class="stat-sub">Active this season</div></div>
    <div class="stat-card"><div class="stat-label">Avg Points</div><div class="stat-value">${avgPts}</div><div class="stat-sub">Across all players</div></div>
  `;
}

function renderTable() {
  const query  = document.getElementById('searchInput').value.toLowerCase().trim();
  const sorted = [...players].sort((a, b) => b[sortKey] - a[sortKey] || b.points - a.points);
  const list   = sorted.filter(p => {
    const gOk = filter === 'all' || p.gender === filter;
    const sOk = !query || p.name.toLowerCase().includes(query);
    return gOk && sOk;
  });

  const tbody = document.getElementById('tableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p style="font-weight:600;">No players found</p>
      <p style="font-size:0.82rem;margin-top:4px;">Adjust filter or search</p>
    </div></td></tr>`;
    return;
  }

  const totalCount = list.length;
  const visible = list.slice(0, rankVisible);

  let rank = 1;
  const adminActs = typeof isAdmin === 'function' && isAdmin();
  tbody.innerHTML = visible.map((p, i) => {
    if (i > 0 && p.points < visible[i - 1].points) rank = i + 1;
    const rc  = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const chg = p.change > 0
      ? `<span class="rank-change up">&#9650;${p.change}</span>`
      : p.change < 0
      ? `<span class="rank-change down">&#9660;${Math.abs(p.change)}</span>`
      : `<span class="rank-change">&#9650;0</span>`;
    const gainHtml = p.gain == null
      ? `<span class="gain-neu">—</span>`
      : p.gain > 0 ? `<span class="gain-pos">+${p.gain.toFixed(1)}</span>`
      : p.gain < 0 ? `<span class="gain-neg">${p.gain.toFixed(1)}</span>`
      : `<span class="gain-neu">0.0</span>`;
    const tierLabel = p.tier.charAt(0).toUpperCase() + p.tier.slice(1);
    const actionsTd = adminActs
      ? `<td><div class="actions-cell">
          <button class="btn-icon edit" onclick="openModal(${p.id})" title="Edit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon del" onclick="askDelete(${p.id},'${esc(p.name)}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div></td>`
      : '';
    return `<tr>
      <td><div class="rank-cell"><span class="rank-num ${rc}">${rank}</span>${chg}</div></td>
      <td><div class="player-cell">
        <div class="player-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
        <div><span class="player-name">${esc(p.name)}</span><span class="tier-badge tier-${p.tier}">${tierLabel}</span></div>
      </div></td>
      <td class="num"><span class="points-val">${p.points.toFixed(1)}</span></td>
      <td class="num">${gainHtml}</td>
      <td class="num"><span class="played-val">${p.played}</span></td>
      <td class="num"><span class="streak-val">${p.streak}</span></td>
      <td class="num"><span class="ref-val">${p.ref > 0 ? '+' + p.ref : p.ref}</span></td>
      ${actionsTd}
    </tr>`;
  }).join('');

  // Load More button
  const existingBtn = document.getElementById('rankLoadMore');
  if (existingBtn) existingBtn.remove();
  if (totalCount > rankVisible) {
    const btn = document.createElement('button');
    btn.id = 'rankLoadMore';
    btn.className = 'rank-load-more';
    btn.textContent = `Load More (${rankVisible} of ${totalCount})`;
    btn.onclick = () => { rankVisible += 25; renderTable(); };
    tbody.closest('table').parentElement.after(btn);
  }

  document.querySelectorAll('thead th').forEach(th => {
    th.classList.remove('sorted');
    if (th.getAttribute('onclick') === `setSort('${sortKey}')`) th.classList.add('sorted');
  });
}

function render() { renderStats(); renderTable(); }

function setFilter(f, btn) {
  filter = f;
  rankVisible = 25;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}

function setSort(key) { sortKey = key; rankVisible = 25; renderTable(); }
