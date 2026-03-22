const { Resend } = require('resend');

let _resend;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('Missing RESEND_API_KEY environment variable');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Vienna Imperials <noreply@imperialsdodgeball.com>';

async function sendEmail({ to, subject, html, text, headers }) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    ...(headers ? { headers } : {})
  });
  return result;
}

module.exports = { sendEmail, getResend };
