/* ═══════════════════════════════════════
   SITE UI — Vienna Imperials
   Scroll effects, reveal animations, mobile menu
═══════════════════════════════════════ */

// ── Scroll progress bar + sticky nav
const progressBar = document.getElementById('progress-bar');
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (scrollTop / docHeight * 100) + '%';
  navbar.classList.toggle('scrolled', scrollTop > 40);
}, { passive: true });

// ── Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

// ── Gold underline reveal
const underlines = document.querySelectorAll('.gold-underline');
const underlineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      underlineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
underlines.forEach(el => underlineObserver.observe(el));

// ── Trigger hero reveals immediately
document.querySelectorAll('#hero .reveal').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), i * 120);
});

// ── Mobile menu toggle
function toggleMenu() {
  document.body.classList.toggle('nav-open');
  const expanded = document.body.classList.contains('nav-open');
  document.querySelector('.nav-toggle').setAttribute('aria-expanded', expanded);
}
document.getElementById('navToggleBtn')?.addEventListener('click', toggleMenu);

// ── Close mobile menu on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('nav') && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
  }
});

// ── Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 680) {
      document.body.classList.remove('nav-open');
    }
  });
});
