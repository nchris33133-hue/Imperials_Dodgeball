const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://www.imperialsdodgeball.com';

function setCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers['origin'];
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
}

module.exports = { setCors, ALLOWED_ORIGIN };
