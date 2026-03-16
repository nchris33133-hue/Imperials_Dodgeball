const fs = require('fs');
const path = require('path');
const { setCors } = require('./lib/cors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeCsvField(v) {
  let str = String(v).replace(/"/g, '""');
  // Prevent CSV injection: prefix formula-like values
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

module.exports = async (req, res) => {
  setCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, level = '', source = '', type = 'join' } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  // Validate email format
  const trimmedEmail = String(email).trim().toLowerCase();
  if (trimmedEmail.length > 254 || !EMAIL_RE.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate name length
  const trimmedName = String(name).trim();
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  const csvPath = path.join('/tmp', 'signups.csv');
  const headers = 'timestamp,type,name,email,level,source\n';
  const row = `"${new Date().toISOString()}","${sanitizeCsvField(type)}","${sanitizeCsvField(trimmedName)}","${sanitizeCsvField(trimmedEmail)}","${sanitizeCsvField(level)}","${sanitizeCsvField(source)}"\n`;

  try {
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, headers + row);
    } else {
      fs.appendFileSync(csvPath, row);
    }
    const message = type === 'newsletter'
      ? 'Thanks for subscribing! / Danke für deine Anmeldung!'
      : "Thanks for signing up! We'll be in touch. / Danke! Wir melden uns bald.";
    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error('Signup write error:', err.message);
    return res.status(500).json({ error: 'Could not save signup' });
  }
};
