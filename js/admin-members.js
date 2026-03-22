/* ═══════════════════════════════════════
   ADMIN MEMBERS — Vienna Imperials
   Member approvals panel
═══════════════════════════════════════ */

async function loadPendingMembers() {
  const container = document.getElementById('pendingMembersList');
  if (!container) return;
  container.innerHTML = '<p style="color:#8899bb; font-size:.9rem;">Loading...</p>';

  try {
    // Also fetch rankings to populate the player dropdown
    const [membersRes, rankingsRes] = await Promise.all([
      fetch('/api/admin/members?status=pending', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      }),
      fetch('/api/rankings')
    ]);

    const { members } = await membersRes.json();
    const rankingsData = await rankingsRes.json();
    const players = rankingsData.players || [];

    if (!members || members.length === 0) {
      container.innerHTML = '<p style="color:#8899bb; font-size:.9rem; padding:.5rem 0;">No pending members.</p>';
      return;
    }

    const playerOptions = players.map(p =>
      `<option value="${esc(p.name)}">${esc(p.name)}</option>`
    ).join('');

    container.innerHTML = members.map(m => `
      <div id="member-row-${m.id}" style="background:#122060; border:1px solid rgba(53,103,192,.22); border-radius:.5rem; padding:1rem; margin-bottom:.75rem;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:.75rem;">
          <div style="flex:1; min-width:200px;">
            <div style="font-weight:600; color:#F4F7FF;">${esc(m.display_name)}</div>
            <div style="font-size:.8rem; color:#8899bb;">${esc(m.email)}</div>
            <div style="font-size:.75rem; color:#8899bb; margin-top:.2rem;">Registered: ${new Date(m.created_at).toLocaleDateString('de-AT')}</div>
          </div>
          <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
            <select id="player-select-${esc(m.id)}" style="background:#0F2150; color:#F4F7FF; border:1px solid rgba(53,103,192,.4); border-radius:.375rem; padding:.3rem .6rem; font-size:.85rem;">
              <option value="">— No player link —</option>
              ${playerOptions}
            </select>
            <button data-member-id="${esc(m.id)}" data-action="approve" style="background:#1A7A3A; color:#fff; border:none; padding:.35rem .8rem; border-radius:.375rem; cursor:pointer; font-size:.85rem; font-weight:600;">APPROVE</button>
            <button data-member-id="${esc(m.id)}" data-action="reject" style="background:#8B1A1A; color:#fff; border:none; padding:.35rem .8rem; border-radius:.375rem; cursor:pointer; font-size:.85rem; font-weight:600;">REJECT</button>
          </div>
        </div>
      </div>
    `).join('');

    // Event delegation — attach once (guard prevents accumulation on reload)
    if (!container._delegated) {
      container._delegated = true;
      container.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-member-id][data-action]');
        if (btn) handleMemberAction(btn.dataset.memberId, btn.dataset.action);
      });
    }
  } catch (err) {
    container.innerHTML = '<p style="color:#E8193C; font-size:.9rem;">Failed to load members.</p>';
  }
}

async function handleMemberAction(userId, action) {
  const selectEl = document.getElementById('player-select-' + userId);
  const ranking_player_name = selectEl ? selectEl.value : '';

  if (action === 'approve' && !ranking_player_name) {
    if (!confirm('Approve without linking to a player?')) return;
  }

  try {
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ user_id: userId, action, ranking_player_name })
    });
    if (!res.ok) throw new Error('Request failed');
    // Remove the row from the list
    const row = document.getElementById('member-row-' + userId);
    if (row) {
      row.style.opacity = '0.4';
      row.style.pointerEvents = 'none';
      row.querySelector('div > div:first-child').innerHTML += `<div style="color:${action === 'approve' ? '#4CAF50' : '#E8193C'}; font-size:.8rem; margin-top:.2rem; font-weight:600;">${action === 'approve' ? 'APPROVED' : 'REJECTED'}</div>`;
    }
  } catch {
    alert('Action failed. Please try again.');
  }
}
