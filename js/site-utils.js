/* ═══════════════════════════════════════
   SITE UTILITIES — Vienna Imperials
   Toast notifications, HTML escaping, global keyboard handlers
═══════════════════════════════════════ */

let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  const dot = document.getElementById('toastDot');
  document.getElementById('toastMsg').textContent = msg;
  dot.className = `toast-dot ${type}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
    closeImport();
    closeAdminLoginModal();
    closeSessionModal();
    closeRecurringModal();
  }
});
