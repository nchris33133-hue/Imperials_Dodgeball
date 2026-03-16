const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://imperialsdodgeball.com';

function setCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers['origin'];
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

module.exports = { setCors, ALLOWED_ORIGIN };
