/* ═══════════════════════════════════════
   EMAIL TEMPLATES — Vienna Imperials
   Bilingual (DE/EN) HTML email templates
═══════════════════════════════════════ */

const SITE_URL = 'https://imperialsdodgeball.com';

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0C1B3A;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C1B3A;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F2150;border:1px solid rgba(53,103,192,0.2);border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0C1B3A,#122060);padding:28px 32px;text-align:center;border-bottom:2px solid #D4961A;">
          <img src="${SITE_URL}/cropped-Vienna-Imperials-03-1.png" alt="Vienna Imperials" width="64" height="64" style="display:block;margin:0 auto 12px;"/>
          <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#F0B830;text-transform:uppercase;">Vienna Imperials</div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(53,103,192,0.15);text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(244,247,255,0.4);">
            Vienna Imperials Dodgeball Club &middot; Vienna, Austria
          </p>
          <p style="margin:0;font-size:12px;color:rgba(244,247,255,0.3);">
            <a href="${SITE_URL}/datenschutz.html" style="color:rgba(212,150,26,0.7);text-decoration:none;">Datenschutz / Privacy</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}/impressum.html" style="color:rgba(212,150,26,0.7);text-decoration:none;">Impressum</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function signupConfirmation({ name }) {
  const subject = 'Willkommen bei den Vienna Imperials! / Welcome to the Vienna Imperials!';

  const content = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#F0B830;font-weight:800;letter-spacing:1px;">WILLKOMMEN / WELCOME</h2>
      <p style="margin:0 0 16px;font-size:15px;color:rgba(244,247,255,0.8);line-height:1.6;">
        ${name ? `Hallo ${name},` : 'Hallo,'}<br/><br/>
        Danke für dein Interesse an den Vienna Imperials! Wir haben deine Anmeldung erhalten und melden uns bald bei dir.<br/><br/>
        Thanks for your interest in the Vienna Imperials! We've received your signup and will be in touch soon.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr><td style="background:linear-gradient(135deg,#D4961A,#F0B830);border-radius:6px;padding:12px 24px;">
          <a href="${SITE_URL}" style="color:#0C1B3A;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">Zur Website / Visit Website</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:rgba(244,247,255,0.5);line-height:1.5;">
        Training findet regelmäßig in Wien statt. Details findest du auf unserer Website.<br/>
        Training takes place regularly in Vienna. Check our website for details.
      </p>`;

  const text = `Willkommen / Welcome\n\n${name ? `Hallo ${name},` : 'Hallo,'}\n\nDanke für dein Interesse an den Vienna Imperials! Wir melden uns bald.\nThanks for your interest! We'll be in touch soon.\n\nVienna Imperials - ${SITE_URL}`;

  return { subject, html: baseLayout(content), text };
}

function trainingReminder({ name, session }) {
  const { title, date, startTime, endTime, location } = session;

  // Format date for display
  const d = new Date(date + 'T00:00:00');
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dateStr = `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
  const dateStrEn = `${daysEn[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  const fmtTime = t => t ? t.split(':').slice(0, 2).join(':') : '';

  const subject = `Training morgen: ${title} / Training tomorrow: ${title}`;

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#F0B830;font-weight:800;letter-spacing:1px;">TRAINING ERINNERUNG / REMINDER</h2>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(244,247,255,0.8);line-height:1.6;">
      ${name ? `Hallo ${name},` : 'Hallo,'}<br/><br/>
      Morgen ist Training! / Training is tomorrow!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(12,27,58,0.6);border:1px solid rgba(53,103,192,0.2);border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:20px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#F0B830;text-transform:uppercase;margin-bottom:8px;">${dateStr}</div>
        <div style="font-size:18px;font-weight:800;color:#F4F7FF;margin-bottom:4px;">${title}</div>
        <div style="font-size:14px;color:rgba(244,247,255,0.6);">
          ${fmtTime(startTime)} – ${fmtTime(endTime)}${location ? ` &middot; ${location}` : ''}
        </div>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:linear-gradient(135deg,#D4961A,#F0B830);border-radius:6px;padding:12px 24px;">
        <a href="${SITE_URL}/member#training" style="color:#0C1B3A;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">RSVP im Dashboard / RSVP in Dashboard</a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:12px;color:rgba(244,247,255,0.35);line-height:1.5;">
      Du erhältst diese E-Mail als Mitglied der Vienna Imperials. Benachrichtigungen können im <a href="${SITE_URL}/member#settings" style="color:rgba(212,150,26,0.7);">Dashboard</a> deaktiviert werden.<br/>
      You receive this email as a Vienna Imperials member. Notifications can be disabled in your <a href="${SITE_URL}/member#settings" style="color:rgba(212,150,26,0.7);">dashboard</a>.
    </p>`;

  const text = `Training Erinnerung / Reminder\n\n${name ? `Hallo ${name},` : 'Hallo,'}\n\nMorgen ist Training! / Training is tomorrow!\n\n${title}\n${dateStr} (${dateStrEn})\n${fmtTime(startTime)} – ${fmtTime(endTime)}${location ? ` | ${location}` : ''}\n\nRSVP: ${SITE_URL}/member#training\n\nVienna Imperials - ${SITE_URL}`;

  return { subject, html: baseLayout(content), text };
}

module.exports = { signupConfirmation, trainingReminder };
