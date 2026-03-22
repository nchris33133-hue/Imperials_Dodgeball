/* ═══════════════════════════════════════
   SITE FAQ — Vienna Imperials
   FAQ language toggle (DE/EN)
═══════════════════════════════════════ */

function setFaqLang(lang) {
  document.getElementById('faqDe').style.display = lang === 'de' ? '' : 'none';
  document.getElementById('faqEn').style.display = lang === 'en' ? '' : 'none';
  const active = { background: 'rgba(212,150,26,0.15)', borderColor: 'rgba(212,150,26,0.5)', color: 'var(--gold-lt)' };
  const inactive = { background: 'transparent', borderColor: 'rgba(244,247,255,0.2)', color: 'rgba(244,247,255,0.6)' };
  Object.assign(document.getElementById('faqBtnDe').style, lang === 'de' ? active : inactive);
  Object.assign(document.getElementById('faqBtnEn').style, lang === 'en' ? active : inactive);
}

document.getElementById('faqBtnDe')?.addEventListener('click', () => setFaqLang('de'));
document.getElementById('faqBtnEn')?.addEventListener('click', () => setFaqLang('en'));
