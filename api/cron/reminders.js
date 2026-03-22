const { getDb } = require('../../lib/db');
const { sendEmail } = require('../../lib/email');
const { trainingReminder } = require('../../lib/email-templates');

module.exports = async (req, res) => {
  // Verify cron secret (Vercel sends Authorization header for cron jobs)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  try {
    // Find sessions happening tomorrow (UTC-based, close enough for daily cron)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const sessions = await sql`
      SELECT id, title, location, session_date, start_time, end_time
      FROM training_sessions
      WHERE session_date = ${tomorrowStr}
        AND is_cancelled = false
    `;

    if (sessions.length === 0) {
      return res.status(200).json({ message: 'No sessions tomorrow', sent: 0 });
    }

    // Get all active members who have email_notifications enabled
    const members = await sql`
      SELECT id, email, display_name
      FROM users
      WHERE is_active = true
        AND status = 'approved'
        AND (email_notifications IS NULL OR email_notifications = true)
    `;

    let sent = 0;
    let failed = 0;

    for (const session of sessions) {
      for (const member of members) {
        try {
          const template = trainingReminder({
            name: member.display_name,
            session: {
              title: session.title,
              date: typeof session.session_date === 'string'
                ? session.session_date.slice(0, 10)
                : session.session_date.toISOString().slice(0, 10),
              startTime: session.start_time,
              endTime: session.end_time,
              location: session.location
            }
          });

          const result = await sendEmail({
            to: member.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            headers: {
              'List-Unsubscribe': '<https://imperialsdodgeball.com/member#settings>'
            }
          });

          // Log for GDPR audit trail
          await sql`
            INSERT INTO email_log (recipient_email, email_type, subject, status, resend_id)
            VALUES (${member.email}, 'training_reminder', ${template.subject}, 'sent', ${result?.data?.id || null})
          `.catch(() => {});

          sent++;
        } catch (err) {
          console.error(`Failed to send reminder to ${member.email}:`, err.message);
          failed++;
        }
      }
    }

    return res.status(200).json({
      message: 'Reminders processed',
      sessions: sessions.length,
      members: members.length,
      sent,
      failed
    });
  } catch (err) {
    console.error('Cron reminders error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
