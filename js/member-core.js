/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let currentUser = null;
let rankingsData = [];
let lbFilter = 'all';
let lbSort = { key: 'points', asc: false };
let activeTab = 'stats';
let lbVisible = 25;
let trainingSessions = [];
let trainingLoaded = false;
const rsvpInFlight = new Set();

/* ═══════════════════════════════════════
   API HELPER
═══════════════════════════════════════ */
async function api(url, opts = {}) {
  const options = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  };
  const res = await fetch(url, options);

  // Try silent refresh on 401
  if (res.status === 401 && !opts._retried) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return api(url, { ...opts, _retried: true });
    }
    showSessionExpired();
    throw new Error('SESSION_EXPIRED');
  }

  return res;
}

async function silentRefresh() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) currentUser = data.user;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════
   VIEW SWITCHING
═══════════════════════════════════════ */
function showView(view) {
  document.body.classList.remove('nav-open');
  document.getElementById('loginView').style.display = view === 'login' ? '' : 'none';
  document.getElementById('registerView').style.display = view === 'register' ? '' : 'none';
  document.getElementById('pendingView').style.display = view === 'pending' ? '' : 'none';
  document.getElementById('dashboardView').classList.toggle('active', view === 'dashboard');

  // Nav state
  document.querySelectorAll('.nav-guest').forEach(el => el.style.display = view === 'dashboard' ? 'none' : '');
  document.querySelectorAll('.nav-member').forEach(el => el.style.display = view === 'dashboard' ? '' : 'none');

  if (view === 'login') setTimeout(() => document.getElementById('loginEmail').focus(), 60);
  if (view === 'register') setTimeout(() => document.getElementById('regName').focus(), 60);
}

function updateNavUser() {
  if (currentUser) {
    document.getElementById('navMemberName').textContent = currentUser.display_name;
  }
}

/* ═══════════════════════════════════════
   TAB NAVIGATION
═══════════════════════════════════════ */
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.style.display = panel.id === 'tab-' + tab ? 'block' : 'none';
  });
  // Lazy-load training data on first visit
  if (tab === 'training' && !trainingLoaded) {
    loadTrainingSessions();
  }
}

/* ═══════════════════════════════════════
   VALIDATION
═══════════════════════════════════════ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  const input = el.previousElementSibling;
  if (input && (input.classList.contains('field-input') || input.classList.contains('password-wrap'))) {
    const inp = input.classList.contains('password-wrap') ? input.querySelector('.field-input') : input;
    inp.classList.add('error');
  }
}

function clearFieldError(id) {
  const el = document.getElementById(id);
  el.textContent = '';
  el.classList.remove('show');
}

function clearAllErrors(prefix) {
  document.querySelectorAll(`[id^="${prefix}"][id$="Error"]`).forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  document.querySelectorAll(`#${prefix}View .field-input`).forEach(el => el.classList.remove('error'));
}

/* ═══════════════════════════════════════
   PASSWORD STRENGTH
═══════════════════════════════════════ */
document.getElementById('regPassword').addEventListener('input', function() {
  const pw = this.value;
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let strength = 0;
  if (pw.length >= 8) strength++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) strength++;
  if (/[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) strength++;

  const levels = [
    { w: '0%', bg: 'transparent', text: '', color: '' },
    { w: '33%', bg: '#F87171', text: 'Weak', color: '#F87171' },
    { w: '66%', bg: 'var(--gold)', text: 'Good', color: 'var(--gold-lt)' },
    { w: '100%', bg: '#4ADE80', text: 'Strong', color: '#4ADE80' },
  ];
  const level = pw.length === 0 ? levels[0] : levels[Math.min(strength, 3)];
  fill.style.width = level.w;
  fill.style.background = level.bg;
  label.textContent = level.text;
  label.style.color = level.color;
});

/* ═══════════════════════════════════════
   PASSWORD VISIBILITY TOGGLE
═══════════════════════════════════════ */
function togglePasswordVisibility(btn) {
  const input = btn.previousElementSibling;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

/* ═══════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════ */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
}

/* ═══════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════ */
document.addEventListener('click', function(e) {
  if (!e.target.closest('nav') && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
  }
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => document.body.classList.remove('nav-open'));
});
