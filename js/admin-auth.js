/* ═══════════════════════════════════════
   ADMIN AUTH — Vienna Imperials
   Admin login/logout, session management, UI state
═══════════════════════════════════════ */

const SESSION_KEY = 'vi_admin_token';

function isAdmin() { return !!sessionStorage.getItem(SESSION_KEY); }
function getToken() { return sessionStorage.getItem(SESSION_KEY) || ''; }

function updateAdminUI() {
  const admin = isAdmin();
  document.body.classList.toggle('admin-mode', admin);
  document.getElementById('adminNavLoginItem').style.display  = admin ? 'none' : (window.location.hash === '#admin-access' ? 'list-item' : 'none');
  document.getElementById('adminNavLoggedItem').style.display = admin ? 'list-item' : 'none';
  document.getElementById('rankingsAdminBar').style.display   = admin ? 'flex' : 'none';
  const approvalsPanel = document.getElementById('memberApprovalsPanel');
  if (approvalsPanel) {
    approvalsPanel.style.display = admin ? 'block' : 'none';
    if (admin) loadPendingMembers();
  }
  const trainingPanel = document.getElementById('adminTrainingPanel');
  if (trainingPanel) {
    trainingPanel.classList.toggle('visible', admin);
    if (admin) loadAdminTrainingSessions();
  }
}

function openAdminLoginModal() {
  document.getElementById('adminLoginBackdrop').classList.add('open');
  setTimeout(() => document.getElementById('adminLoginPass').focus(), 60);
}
function closeAdminLoginModal() {
  document.getElementById('adminLoginBackdrop').classList.remove('open');
  document.getElementById('adminLoginPass').value = '';
  document.getElementById('adminLoginError').classList.remove('show');
}
function adminLoginBdClick(e) {
  if (e.target === document.getElementById('adminLoginBackdrop')) closeAdminLoginModal();
}
async function attemptAdminLogin() {
  const val = document.getElementById('adminLoginPass').value;
  const loginBtn = document.querySelector('.login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Verifying…';
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: val })
    });
    if (res.ok) {
      const { token } = await res.json();
      sessionStorage.setItem(SESSION_KEY, token);
      closeAdminLoginModal();
      updateAdminUI();
      await loadPlayersFromAPI();
      render();
      toast('Welcome back, Admin', 'success');
    } else {
      const card  = document.getElementById('adminLoginCard');
      const error = document.getElementById('adminLoginError');
      error.classList.add('show');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      document.getElementById('adminLoginPass').value = '';
      document.getElementById('adminLoginPass').focus();
    }
  } catch (err) {
    toast('Login failed — network error', 'danger');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Enter Admin Mode';
  }
}
function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  updateAdminUI();
  render();
  toast('Logged out', 'info');
}
document.getElementById('adminLoginPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptAdminLogin();
});

// ── Hidden admin route: /#admin-access reveals login button
function checkAdminRoute() {
  if (window.location.hash === '#admin-access') {
    document.getElementById('adminNavLoginItem').style.display = 'list-item';
  }
}
checkAdminRoute();
window.addEventListener('hashchange', checkAdminRoute);
