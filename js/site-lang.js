/* ═══════════════════════════════════════
   SITE LANG — Vienna Imperials
   Generic DE/EN toggle for sections
   Uses data-section and data-lang attributes
═══════════════════════════════════════ */

(function () {
  var ACTIVE = { background: 'rgba(212,150,26,0.15)', borderColor: 'rgba(212,150,26,0.5)', color: 'var(--gold-lt)' };
  var INACTIVE = { background: 'transparent', borderColor: 'rgba(244,247,255,0.2)', color: 'rgba(244,247,255,0.6)' };

  function switchLang(section, lang) {
    document.querySelectorAll('.lang-content[data-section="' + section + '"]').forEach(function (el) {
      el.style.display = el.getAttribute('data-lang') === lang ? '' : 'none';
    });
    document.querySelectorAll('.lang-btn[data-section="' + section + '"]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      Object.assign(btn.style, isActive ? ACTIVE : INACTIVE);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.lang-btn[data-section]');
    if (!btn) return;
    switchLang(btn.getAttribute('data-section'), btn.getAttribute('data-lang'));
  });
})();
