/* ═══════════════════════════════════════
   SITE FORMS — Vienna Imperials
   Join form signup
═══════════════════════════════════════ */

function switchCtaTab(tab) {
  const joinForm = document.getElementById('joinForm');
  const contactForm = document.getElementById('contactForm');
  const tabJoin = document.getElementById('tabJoin');
  const tabContact = document.getElementById('tabContact');
  if (tab === 'contact') {
    joinForm.style.display = 'none';
    contactForm.style.display = 'block';
    tabJoin.classList.remove('active');
    tabContact.classList.add('active');
  } else {
    joinForm.style.display = 'block';
    contactForm.style.display = 'none';
    tabJoin.classList.add('active');
    tabContact.classList.remove('active');
  }
}

async function submitContactForm(e) {
  e.preventDefault();
  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();
  if (!name || !email || !message) { toast('Please fill in all fields', 'danger'); return; }
  if (message.length < 10) { toast('Message must be at least 10 characters', 'danger'); return; }
  const btn = document.getElementById('contactSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, type: 'contact' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const form = document.getElementById('contactForm');
      form.reset();
      form.style.display = 'none';
      const s = document.getElementById('contactSuccess');
      s.textContent = data.message;
      s.style.display = 'block';
    } else {
      toast(data.error || 'Something went wrong. Please try again.', 'danger');
      if (btn) { btn.disabled = false; btn.textContent = 'Senden / Send'; }
    }
  } catch {
    toast('Network error. Please try again.', 'danger');
    if (btn) { btn.disabled = false; btn.textContent = 'Senden / Send'; }
  }
}

document.getElementById('joinForm')?.addEventListener('submit', submitJoinForm);
document.getElementById('contactForm')?.addEventListener('submit', submitContactForm);

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
      const form = document.getElementById('joinForm');
      form.reset();
      form.style.display = 'none';
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
