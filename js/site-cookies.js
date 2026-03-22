/* ═══════════════════════════════════════
   SITE COOKIES — Vienna Imperials
   Cookie consent banner
═══════════════════════════════════════ */

(function() {
  const consent = localStorage.getItem('vi_cookie_consent');
  const banner  = document.getElementById('cookieBanner');
  if (!consent) { banner.style.display = 'flex'; }
  if (consent === 'declined') {
    document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(el => el.remove());
  }
})();

function acceptCookies() {
  localStorage.setItem('vi_cookie_consent', 'accepted');
  document.getElementById('cookieBanner').style.display = 'none';
}

function declineCookies() {
  localStorage.setItem('vi_cookie_consent', 'declined');
  document.getElementById('cookieBanner').style.display = 'none';
  document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(el => el.remove());
}

document.getElementById('cookieAcceptBtn')?.addEventListener('click', acceptCookies);
document.getElementById('cookieDeclineBtn')?.addEventListener('click', declineCookies);
