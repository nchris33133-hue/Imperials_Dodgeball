/* ═══════════════════════════════════════
   SITE FORMS — Vienna Imperials
   Join form and newsletter signup
═══════════════════════════════════════ */

async function submitSignupForm(formId, successId, submitBtnId, type) {
  const nameEl  = document.getElementById(formId === 'joinForm' ? 'joinName' : 'nlName');
  const emailEl = document.getElementById(formId === 'joinForm' ? 'joinEmail' : 'nlEmail');
  const name  = nameEl?.value.trim();
  const email = emailEl?.value.trim();
  const level  = formId === 'joinForm' ? (document.getElementById('joinLevel')?.value || '') : '';
  const source = formId === 'joinForm' ? (document.getElementById('joinSource')?.value || '') : '';
  if (!name || !email) { toast('Please fill in Name and Email', 'danger'); return; }
  // Check newsletter consent checkbox
  const consentEl = type === 'newsletter' ? document.getElementById('nlConsent') : null;
  const email_consent = consentEl ? consentEl.checked : false;
  if (type === 'newsletter' && !email_consent) { toast('Bitte Einwilligung bestätigen / Please confirm consent', 'danger'); return; }
  const btn = submitBtnId ? document.getElementById(submitBtnId) : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, level, source, type, email_consent })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      document.getElementById(formId).style.display = 'none';
      const s = document.getElementById(successId);
      s.textContent = data.message;
      s.style.display = 'block';
    } else {
      toast('Something went wrong. Please try again.', 'danger');
      if (btn) { btn.disabled = false; btn.textContent = type === 'newsletter' ? 'Abonnieren / Subscribe' : 'Jetzt mitmachen / Join the League'; }
    }
  } catch {
    toast('Network error. Please try again.', 'danger');
    if (btn) { btn.disabled = false; btn.textContent = type === 'newsletter' ? 'Abonnieren / Subscribe' : 'Jetzt mitmachen / Join the League'; }
  }
}

function submitJoinForm(e) { e.preventDefault(); submitSignupForm('joinForm', 'joinSuccess', 'joinSubmitBtn', 'join'); }
function submitNewsletterForm(e) { e.preventDefault(); submitSignupForm('newsletterForm', 'nlSuccess', null, 'newsletter'); }
