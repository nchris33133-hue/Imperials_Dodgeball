/* ═══════════════════════════════════════
   EVENT WIRING — replaces inline handlers for CSP compliance
═══════════════════════════════════════ */

// Skip-to-content link
var skipLink = document.getElementById('skipLink');
if (skipLink) {
  skipLink.addEventListener('focus', function() { this.style.top = '0'; });
  skipLink.addEventListener('blur', function() { this.style.top = '-40px'; });
}

// Nav
document.getElementById('navLoginBtn').addEventListener('click', function(e) { e.preventDefault(); showView('login'); });
document.getElementById('navLogoutBtn').addEventListener('click', function() { handleLogout(); });
document.getElementById('navToggleBtn').addEventListener('click', function() { document.body.classList.toggle('nav-open'); });
document.querySelectorAll('[data-nav-tab]').forEach(function(a) {
  a.addEventListener('click', function(e) { e.preventDefault(); switchTab(a.dataset.navTab); });
});

// Auth forms
document.getElementById('loginForm').addEventListener('submit', function(e) { handleLogin(e); });
document.getElementById('registerForm').addEventListener('submit', function(e) { handleRegister(e); });
document.getElementById('reAuthForm').addEventListener('submit', function(e) { handleReAuth(e); });

// Auth links
document.getElementById('showRegisterLink').addEventListener('click', function(e) { e.preventDefault(); showView('register'); });
document.getElementById('showLoginLink').addEventListener('click', function(e) { e.preventDefault(); showView('login'); });
document.getElementById('fullLogoutLink').addEventListener('click', function(e) { e.preventDefault(); handleFullLogout(); });

// Dismiss banner buttons
document.querySelectorAll('.dismiss-banner').forEach(function(btn) {
  btn.addEventListener('click', function() { this.parentElement.classList.remove('show'); });
});

// Password visibility toggles
document.querySelectorAll('.password-toggle').forEach(function(btn) {
  btn.addEventListener('click', function() { togglePasswordVisibility(this); });
});

// Dashboard tabs
document.querySelectorAll('.dash-tab[data-tab]').forEach(function(btn) {
  btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
});

// Leaderboard filter tabs
document.querySelectorAll('.lb-tab[data-filter]').forEach(function(btn) {
  btn.addEventListener('click', function() { filterLeaderboard(btn.dataset.filter, btn); });
});

// Leaderboard search
document.getElementById('lbSearch').addEventListener('input', function() { debouncedRenderLeaderboard(); });

// Leaderboard sort headers
document.querySelectorAll('#leaderboard th[data-sort]').forEach(function(th) {
  th.addEventListener('click', function() { sortLeaderboard(th.dataset.sort); });
});

// Save preferences
document.getElementById('savePrefsBtn').addEventListener('click', function() { saveEmailPrefs(); });

/* ═══════════════════════════════════════
   INIT — check for existing session
   Calls /api/member/stats directly (no verify round-trip).
   The api() helper handles 401 → silent refresh → retry.
═══════════════════════════════════════ */
(async function init() {
  try {
    const res = await api('/api/member/stats', { _suppressExpired: true });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      enterDashboard(data);
      return;
    }
  } catch { /* no session */ }
  showView('login');
})();
