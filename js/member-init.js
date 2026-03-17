/* ═══════════════════════════════════════
   INIT — check for existing session
   Calls /api/member/stats directly (no verify round-trip).
   The api() helper handles 401 → silent refresh → retry.
═══════════════════════════════════════ */
(async function init() {
  try {
    const res = await api('/api/member/stats');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      enterDashboard(data);
      return;
    }
  } catch { /* no session */ }
  showView('login');
})();
