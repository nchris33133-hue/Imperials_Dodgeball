/* ═══════════════════════════════════════
   TRAINING CALENDAR
═══════════════════════════════════════ */
async function loadTrainingSessions() {
  const loading = document.getElementById('trainingLoading');
  const list = document.getElementById('trainingList');
  const empty = document.getElementById('trainingEmpty');
  const nudge = document.getElementById('trainingNudge');

  loading.style.display = '';
  list.innerHTML = '';
  empty.style.display = 'none';
  nudge.style.display = 'none';

  try {
    const res = await api('/api/training?view=upcoming');
    if (!res.ok) throw new Error('Failed to load sessions');
    const data = await res.json();
    trainingSessions = data.sessions || [];
    trainingLoaded = true;
    loading.style.display = 'none';
    renderTrainingSessions();
  } catch (err) {
    loading.style.display = 'none';
    if (err.message === 'SESSION_EXPIRED') return;
    list.innerHTML = '<div class="training-empty">Failed to load training sessions.</div>';
  }
}

function renderTrainingSessions() {
  const list = document.getElementById('trainingList');
  const empty = document.getElementById('trainingEmpty');
  const nudge = document.getElementById('trainingNudge');

  if (trainingSessions.length === 0) {
    list.innerHTML = '';
    empty.style.display = '';
    nudge.style.display = 'none';
    return;
  }
  empty.style.display = 'none';

  // Count sessions needing response (future, not cancelled, no RSVP)
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' });
  const pending = trainingSessions.filter(s =>
    !s.is_cancelled && s.session_date >= today && (!s.my_status || s.my_status === 'pending')
  );
  if (pending.length > 0) {
    document.getElementById('nudgeText').textContent =
      pending.length === 1
        ? 'You have 1 session awaiting your response.'
        : `You have ${pending.length} sessions awaiting your response.`;
    nudge.style.display = '';
  } else {
    nudge.style.display = 'none';
  }

  list.innerHTML = trainingSessions.map(s => renderSessionCard(s)).join('');
}

function renderSessionCard(s) {
  const d = new Date(s.session_date + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;

  const startTime = formatTime(s.start_time);
  const endTime = formatTime(s.end_time);

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' });
  const isPast = s.session_date < today;
  const isCancelled = s.is_cancelled;
  const canRsvp = !isPast && !isCancelled;

  const attending = parseInt(s.attending_count) || 0;
  const notAttending = parseInt(s.not_attending_count) || 0;
  const myStatus = s.my_status || 'pending';

  const cardClass = isCancelled ? 'session-card cancelled' : 'session-card';

  let rsvpHtml = '';
  if (canRsvp) {
    rsvpHtml = `
      <div class="rsvp-buttons">
        <button class="rsvp-btn rsvp-attending${myStatus === 'attending' ? ' active' : ''}"
                onclick="handleRsvp('${s.id}', 'attending')"
                ${myStatus === 'attending' ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
          Attending
        </button>
        <button class="rsvp-btn rsvp-not-attending${myStatus === 'not_attending' ? ' active' : ''}"
                onclick="handleRsvp('${s.id}', 'not_attending')"
                ${myStatus === 'not_attending' ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
          Not Attending
        </button>
      </div>`;
  } else if (isPast && !isCancelled) {
    if (myStatus === 'attending') {
      rsvpHtml = '<div style="font-size:0.78rem; color:#4ADE80; font-weight:600;">You attended</div>';
    } else if (myStatus === 'not_attending') {
      rsvpHtml = '<div style="font-size:0.78rem; color:#F87171; font-weight:600;">You did not attend</div>';
    }
  }

  const locationHtml = s.location
    ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHtml(s.location)}</span>`
    : '';

  return `
    <div class="${cardClass}" data-session-id="${s.id}">
      <div class="session-date-badge">${escapeHtml(dateStr)}</div>
      <div class="session-title">${escapeHtml(s.title)}</div>
      <div class="session-meta">
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${startTime} \u2013 ${endTime}</span>
        ${locationHtml}
      </div>
      ${!isCancelled ? `
        <div class="session-counts">
          <span class="count-attending">${attending} attending</span>
          <span class="count-not">${notAttending} not attending</span>
        </div>
        ${rsvpHtml}
        <div class="session-attendees">
          <button class="attendees-toggle" onclick="toggleAttendees(this, '${s.id}')">Show who\u2019s coming</button>
          <div class="attendees-list" id="attendees-${s.id}"></div>
        </div>
      ` : ''}
    </div>`;
}

async function handleRsvp(sessionId, status) {
  // Debounce: prevent double-clicks while request is in flight
  if (rsvpInFlight.has(sessionId)) return;
  rsvpInFlight.add(sessionId);

  // Optimistic UI update
  const session = trainingSessions.find(s => s.id === sessionId);
  if (!session) { rsvpInFlight.delete(sessionId); return; }

  const oldStatus = session.my_status;
  const oldAttending = parseInt(session.attending_count) || 0;
  const oldNot = parseInt(session.not_attending_count) || 0;

  // Update counts optimistically
  session.my_status = status;
  if (status === 'attending') {
    session.attending_count = oldAttending + (oldStatus !== 'attending' ? 1 : 0);
    session.not_attending_count = oldNot - (oldStatus === 'not_attending' ? 1 : 0);
  } else {
    session.not_attending_count = oldNot + (oldStatus !== 'not_attending' ? 1 : 0);
    session.attending_count = oldAttending - (oldStatus === 'attending' ? 1 : 0);
  }
  renderTrainingSessions();

  try {
    const res = await api('/api/training', {
      method: 'POST',
      body: JSON.stringify({ action: 'rsvp', session_id: sessionId, status }),
    });
    if (!res.ok) throw new Error('RSVP failed');
    const data = await res.json();
    // Apply server counts
    session.my_status = data.my_status;
    session.attending_count = data.attending_count;
    session.not_attending_count = data.not_attending_count;
    renderTrainingSessions();
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') return;
    // Revert on failure
    session.my_status = oldStatus;
    session.attending_count = oldAttending;
    session.not_attending_count = oldNot;
    renderTrainingSessions();
  } finally {
    rsvpInFlight.delete(sessionId);
  }
}

async function toggleAttendees(btn, sessionId) {
  const listEl = document.getElementById('attendees-' + sessionId);
  if (!listEl) return;

  if (listEl.classList.contains('open')) {
    listEl.classList.remove('open');
    btn.textContent = 'Show who\u2019s coming';
    return;
  }

  btn.textContent = 'Loading...';
  try {
    const res = await api('/api/training?view=session&id=' + sessionId);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    const attending = data.attendees.filter(a => a.status === 'attending');
    const notAttending = data.attendees.filter(a => a.status === 'not_attending');

    let html = '';
    if (attending.length > 0) {
      html += `<div class="attendees-label att-yes">Attending (${attending.length})</div>`;
      html += attending.map(a => escapeHtml(a.display_name)).join(', ');
    }
    if (notAttending.length > 0) {
      html += `<div class="attendees-label att-no" style="margin-top:8px;">Not Attending (${notAttending.length})</div>`;
      html += notAttending.map(a => escapeHtml(a.display_name)).join(', ');
    }
    if (!html) {
      html = '<div style="color:rgba(244,247,255,0.3); font-size:0.8rem;">No responses yet.</div>';
    }

    listEl.innerHTML = html;
    listEl.classList.add('open');
    btn.textContent = 'Hide attendees';
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') return;
    btn.textContent = 'Show who\u2019s coming';
  }
}
