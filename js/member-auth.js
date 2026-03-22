/* ═══════════════════════════════════════
   LOGIN
═══════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors('login');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;
  let hasError = false;

  if (!email) { showFieldError('loginEmailError', 'Email is required'); hasError = true; }
  else if (!EMAIL_RE.test(email)) { showFieldError('loginEmailError', 'Please enter a valid email address'); hasError = true; }
  if (!password) { showFieldError('loginPasswordError', 'Password is required'); hasError = true; }

  if (hasError) return;

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember_me: remember }),
    });

    const data = await res.json();

    if (res.status === 429) {
      const banner = document.getElementById('loginBanner');
      document.getElementById('loginBannerText').textContent = data.error;
      banner.classList.add('show');
      btn.disabled = true;
      btn.textContent = 'LOG IN';
      if (data.retry_after) {
        let remaining = data.retry_after;
        const interval = setInterval(() => {
          remaining--;
          btn.textContent = `WAIT ${remaining}s`;
          if (remaining <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.textContent = 'LOG IN';
          }
        }, 1000);
      }
      return;
    }

    if (!res.ok) {
      if (data.code === 'PENDING_APPROVAL') {
        showView('pending');
        return;
      }
      document.getElementById('loginCard').classList.add('shake');
      setTimeout(() => document.getElementById('loginCard').classList.remove('shake'), 400);
      showFieldError('loginError', data.error || 'Invalid email or password');
      btn.disabled = false;
      btn.textContent = 'LOG IN';
      return;
    }

    currentUser = data.user;
    sessionExpiredShown = false;
    enterDashboard();
  } catch (err) {
    const banner = document.getElementById('loginBanner');
    document.getElementById('loginBannerText').textContent = 'Something went wrong. Please try again later.';
    banner.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'LOG IN';
  }
}

/* ═══════════════════════════════════════
   REGISTER
═══════════════════════════════════════ */
async function handleRegister(e) {
  e.preventDefault();
  clearAllErrors('reg');

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  let hasError = false;

  if (!name) { showFieldError('regNameError', 'Display name is required'); hasError = true; }
  else if (name.length < 2) { showFieldError('regNameError', 'Display name must be at least 2 characters'); hasError = true; }
  if (!email) { showFieldError('regEmailError', 'Email is required'); hasError = true; }
  else if (!EMAIL_RE.test(email)) { showFieldError('regEmailError', 'Please enter a valid email address'); hasError = true; }
  if (!password) { showFieldError('regPasswordError', 'Password is required'); hasError = true; }
  else if (password.length < 8) { showFieldError('regPasswordError', 'Password must be at least 8 characters'); hasError = true; }
  if (!confirm) { showFieldError('regConfirmError', 'Please confirm your password'); hasError = true; }
  else if (password !== confirm) { showFieldError('regConfirmError', 'Passwords do not match'); hasError = true; }

  if (hasError) return;

  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, display_name: name }),
    });

    const data = await res.json();

    if (res.status === 409) {
      showFieldError('regEmailError', 'An account with this email already exists');
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
      return;
    }

    if (res.status === 429) {
      const banner = document.getElementById('registerBanner');
      document.getElementById('registerBannerText').textContent = data.error;
      banner.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
      return;
    }

    if (!res.ok) {
      const banner = document.getElementById('registerBanner');
      document.getElementById('registerBannerText').textContent = data.error || 'Registration failed. Please try again.';
      banner.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
      return;
    }

    if (data.pending === true) {
      showView('pending');
      return;
    }

    currentUser = data.user;

    // Show success state
    document.getElementById('registerCard').style.display = 'none';
    document.getElementById('registerSuccess').style.display = '';
    setTimeout(() => enterDashboard(), 1500);
  } catch (err) {
    const banner = document.getElementById('registerBanner');
    document.getElementById('registerBannerText').textContent = 'Something went wrong. Please try again later.';
    banner.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'CREATE ACCOUNT';
  }
}

/* ═══════════════════════════════════════
   SESSION EXPIRED
═══════════════════════════════════════ */
let sessionExpiredShown = false;

function showSessionExpired() {
  if (sessionExpiredShown) return;
  sessionExpiredShown = true;
  const emailField = document.getElementById('reAuthEmail');
  if (currentUser && currentUser.email) {
    emailField.value = currentUser.email;
    emailField.readOnly = true;
    emailField.style.opacity = '0.6';
  } else {
    emailField.value = '';
    emailField.readOnly = false;
    emailField.style.opacity = '';
  }
  document.getElementById('sessionOverlay').classList.add('open');
  const focusTarget = emailField.readOnly ? 'reAuthPassword' : 'reAuthEmail';
  setTimeout(() => document.getElementById(focusTarget).focus(), 60);
}

async function handleReAuth(e) {
  e.preventDefault();
  clearFieldError('reAuthError');
  const email = document.getElementById('reAuthEmail').value;
  const password = document.getElementById('reAuthPassword').value;
  if (!password) { showFieldError('reAuthError', 'Password is required'); return; }

  const btn = document.getElementById('reAuthBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember_me: true }),
    });
    const data = await res.json();

    if (!res.ok) {
      showFieldError('reAuthError', data.error || 'Invalid credentials');
      btn.disabled = false;
      btn.textContent = 'LOG BACK IN';
      return;
    }

    currentUser = data.user;
    sessionExpiredShown = false;
    document.getElementById('sessionOverlay').classList.remove('open');
    document.getElementById('reAuthPassword').value = '';
    btn.disabled = false;
    btn.textContent = 'LOG BACK IN';

    // Re-fetch dashboard data
    enterDashboard();
  } catch {
    showFieldError('reAuthError', 'Something went wrong');
    btn.disabled = false;
    btn.textContent = 'LOG BACK IN';
  }
}

function handleFullLogout() {
  document.getElementById('sessionOverlay').classList.remove('open');
  sessionExpiredShown = false;
  currentUser = null;
  showView('login');
}

/* ═══════════════════════════════════════
   LOGOUT
═══════════════════════════════════════ */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  // Clear all client-side state
  currentUser = null;
  sessionExpiredShown = false;
  trainingLoaded = false;
  trainingSessions = [];
  Object.keys(attendeeCache).forEach(k => delete attendeeCache[k]);
  // Clear auth cookies client-side in case server request failed
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  showView('login');
}
