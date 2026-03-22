const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return 'Email is too long';
  if (!EMAIL_RE.test(trimmed)) return 'Invalid email format';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

function validateDisplayName(name) {
  if (!name || typeof name !== 'string') return 'Display name is required';
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Display name must be at least 2 characters';
  if (trimmed.length > 50) return 'Display name must be at most 50 characters';
  if (!/^[a-zA-ZÀ-ÿ0-9 .\-']+$/.test(trimmed)) return 'Display name contains invalid characters';
  return null;
}

function sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(str) {
  return typeof str === 'string' && UUID_RE.test(str);
}

function requireJSON(req) {
  const ct = req.headers['content-type'] || '';
  return ct.includes('application/json');
}

module.exports = { validateEmail, validatePassword, validateDisplayName, sanitizeHtml, isValidUuid, requireJSON };
