/* ═══════════════════════════════════════
   SITE FORMS — Vienna Imperials
   Join form signup
═══════════════════════════════════════ */

async function submitJoinForm(e) {
  e.preventDefault();
  const nameEl  = document.getElementById('joinName');
  const emailEl = document.getElementById('joinEmail');
  const name  = nameEl?.value.trim();
  const email = emailEl?.value.trim();
  const level  = document.getElementById('joinLevel')?.value || '';
  const source = document.getElementById('joinSource')?.value || '';
  if (!name || !email) { toast('Please fill in Name and Email', 'danger'); return; }
  const btn = document.getElementById('joinSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, level, source, type: 'join' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      document.getElementById('joinForm').style.display = 'none';
      const s = document.getElementById('joinSuccess');
      s.textContent = data.message;
      s.style.display = 'block';
    } else {
      toast('Something went wrong. Please try again.', 'danger');
      if (btn) { btn.disabled = false; btn.textContent = 'Jetzt mitmachen / Join the League'; }
    }
  } catch {
    toast('Network error. Please try again.', 'danger');
    if (btn) { btn.disabled = false; btn.textContent = 'Jetzt mitmachen / Join the League'; }
  }
}
