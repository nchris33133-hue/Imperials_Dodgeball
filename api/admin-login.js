const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { setCors } = require('../lib/cors');
const { checkRateLimit, recordAttempt, clearAttempts } = require('../lib/rate-limit');

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });

  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required', code: 'VALIDATION_ERROR' });

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const secret = process.env.JWT_SECRET;

    if (!hash || !secret) {
      return res.status(500).json({ error: 'Server misconfigured', code: 'SERVER_ERROR' });
    }

    // Rate limit using a fixed key for admin login
    const adminKey = '_admin_login_';
    const rateCheck = await checkRateLimit(adminKey);
    if (rateCheck.limited) {
      return res.status(429).json({
        error: `Too many attempts. Try again in ${Math.ceil(rateCheck.retryAfter / 60)} minutes.`,
        code: 'RATE_LIMITED',
        retry_after: rateCheck.retryAfter
      });
    }

    const match = await bcrypt.compare(password, hash);
    if (!match) {
      await recordAttempt(adminKey);
      return res.status(401).json({ error: 'Invalid password', code: 'INVALID_CREDENTIALS' });
    }

    await clearAttempts(adminKey);
    const token = jwt.sign({ role: 'admin', iss: 'vienna-admin' }, secret, { expiresIn: '1h' });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Admin login failed:', err);
    return res.status(500).json({ error: 'Login failed', code: 'SERVER_ERROR' });
  }
};
