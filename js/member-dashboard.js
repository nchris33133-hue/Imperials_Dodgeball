/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */
async function enterDashboard(prefetchedData) {
  showView('dashboard');
  updateNavUser();
  trainingLoaded = false; // Reset so training tab reloads fresh data
  document.getElementById('dashName').textContent = currentUser.display_name;
  document.getElementById('statsName').textContent = currentUser.display_name;

  // If we already have data (from init), use it directly
  if (prefetchedData) {
    renderDashboardData(prefetchedData);
    return;
  }

  // Otherwise fetch fresh
  showStatsSkeletons();

  try {
    const res = await api('/api/member/stats');
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();
    renderDashboardData(data);
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') return;
    document.querySelectorAll('.stat-value').forEach(el => el.textContent = '\u2014');
    document.getElementById('statsRank').textContent = '\u2014';
  }
}

function showStatsSkeletons() {
  document.querySelectorAll('.stat-value').forEach(el => {
    el.dataset.original = el.textContent;
    el.innerHTML = '<span class="skeleton" style="display:inline-block;width:40px;height:16px;">&nbsp;</span>';
  });
  document.getElementById('statsRank').innerHTML = '<span class="skeleton" style="display:inline-block;width:32px;height:24px;">&nbsp;</span>';
}

function renderDashboardData(data) {
  if (data.user) {
    currentUser = { ...currentUser, ...data.user };
    updateNavUser();
    document.getElementById('dashName').textContent = currentUser.display_name;
    document.getElementById('statsName').textContent = currentUser.display_name;
    // Sync email notification toggle
    const emailToggle = document.getElementById('emailNotifToggle');
    if (emailToggle) emailToggle.checked = data.user.email_notifications !== false;
  }

  if (data.stats) {
    document.getElementById('statsRank').textContent = '#' + data.stats.rank;
    document.getElementById('statPoints').textContent = data.stats.points;
    document.getElementById('statStreak').textContent = data.stats.streak;
    document.getElementById('statPlayed').textContent = data.stats.played;
    document.getElementById('statRef').textContent = data.stats.ref;

    const gainEl = document.getElementById('statGain');
    if (data.stats.gain !== null && data.stats.gain !== undefined) {
      gainEl.textContent = (data.stats.gain > 0 ? '+' : '') + data.stats.gain;
      gainEl.className = 'stat-value ' + (data.stats.gain > 0 ? 'gain-pos' : data.stats.gain < 0 ? 'gain-neg' : '');
    } else {
      gainEl.textContent = '\u2014';
    }

    // Tier badge
    if (data.stats.tier) {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      const tier = validTiers.includes(data.stats.tier) ? data.stats.tier : 'bronze';
      const tierEl = document.getElementById('statsTier');
      tierEl.textContent = data.stats.tier;
      tierEl.className = 'tier-badge tier-' + tier;
      tierEl.style.display = '';
    }

    document.getElementById('statsEmpty').style.display = 'none';
  } else {
    // No linked ranking
    document.querySelectorAll('.stat-value').forEach(el => el.textContent = '\u2014');
    document.getElementById('statsRank').textContent = '\u2014';
    document.getElementById('statsEmpty').style.display = '';
  }

  // Leaderboard
  rankingsData = data.rankings || [];
  renderLeaderboard();
}

/* ═══════════════════════════════════════
   LEADERBOARD
═══════════════════════════════════════ */
function filterLeaderboard(filter, btn) {
  lbFilter = filter;
  lbVisible = 25;
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLeaderboard();
}

function sortLeaderboard(key) {
  if (lbSort.key === key) {
    lbSort.asc = !lbSort.asc;
  } else {
    lbSort.key = key;
    lbSort.asc = key === 'name';
  }
  renderLeaderboard();
}

function renderLeaderboard() {
  const search = (document.getElementById('lbSearch').value || '').toLowerCase();
  let players = [...rankingsData];

  // Sort by points first to determine ranks
  players.sort((a, b) => (b.points || 0) - (a.points || 0));
  players.forEach((p, i) => p._rank = i + 1);

  // Filter
  if (lbFilter !== 'all') {
    players = players.filter(p => p.gender === lbFilter);
  }
  if (search) {
    players = players.filter(p => (p.name || '').toLowerCase().includes(search));
  }

  // Sort
  const { key, asc } = lbSort;
  if (key === 'rank') {
    players.sort((a, b) => asc ? a._rank - b._rank : b._rank - a._rank);
  } else if (key === 'name') {
    players.sort((a, b) => asc ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || ''));
  } else {
    players.sort((a, b) => asc ? (a[key] || 0) - (b[key] || 0) : (b[key] || 0) - (a[key] || 0));
  }

  const tbody = document.getElementById('lbBody');
  const empty = document.getElementById('lbEmpty');

  if (players.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  const totalCount = players.length;
  const visible = players.slice(0, lbVisible);

  const selfName = currentUser && currentUser.ranking_player_name
    ? currentUser.ranking_player_name.toLowerCase()
    : null;

  const medals = ['', '\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
  let selfRow = null;
  let selfInView = false;

  tbody.innerHTML = visible.map(p => {
    const isSelf = selfName && (p.name || '').toLowerCase() === selfName;
    if (isSelf) { selfRow = p._rank; selfInView = true; }
    const rankDisplay = p._rank <= 3
      ? `<span class="rank-medal">${medals[p._rank]}</span>`
      : `<span class="rank-num">${p._rank}</span>`;
    const gainClass = (p.gain > 0) ? 'gain-pos' : (p.gain < 0) ? 'gain-neg' : 'gain-neu';
    const gainText = p.gain > 0 ? '+' + p.gain : (p.gain === null || p.gain === undefined ? '\u2014' : p.gain);
    const tierHtml = p.tier ? `<span class="tier-badge tier-${escapeHtml(p.tier)}">${escapeHtml(p.tier)}</span>` : '';
    const youBadge = isSelf ? '<span class="you-badge">YOU</span>' : '';

    return `<tr class="${isSelf ? 'row-self' : ''}" ${isSelf ? 'aria-current="true"' : ''}>
      <td>${rankDisplay}</td>
      <td><span class="player-name">${escapeHtml(p.name || '')}</span>${tierHtml}${youBadge}</td>
      <td><span class="points-val">${p.points}</span></td>
      <td><span class="${gainClass}">${gainText}</span></td>
      <td>${p.played}</td>
      <td><span class="streak-val">${p.streak}</span></td>
      <td><span class="ref-val">${p.ref}</span></td>
    </tr>`;
  }).join('');

  // Load More button
  const existing = document.getElementById('lbLoadMore');
  if (existing) existing.remove();
  if (totalCount > lbVisible) {
    const btn = document.createElement('button');
    btn.id = 'lbLoadMore';
    btn.className = 'lb-load-more';
    btn.textContent = `Load More (${lbVisible} of ${totalCount})`;
    btn.onclick = () => { lbVisible += 25; renderLeaderboard(); };
    tbody.closest('.lb-table-wrap').after(btn);
  }

  // Auto-scroll to user's row
  if (selfInView && selfRow) {
    setTimeout(() => {
      const row = tbody.querySelector('.row-self');
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

/* ═══════════════════════════════════════
   EMAIL PREFERENCES
═══════════════════════════════════════ */
async function saveEmailPrefs() {
  const toggle = document.getElementById('emailNotifToggle');
  const savedEl = document.getElementById('settingsSaved');
  if (!toggle) return;

  try {
    const res = await api('/api/member/stats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_notifications: toggle.checked })
    });
    if (!res.ok) throw new Error('Failed');
    savedEl.style.display = 'inline';
    setTimeout(() => { savedEl.style.display = 'none'; }, 2500);
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') return;
    alert('Could not save preferences. Please try again.');
  }
}
