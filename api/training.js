const { getDb } = require('../lib/db');
const { setCors } = require('../lib/cors');
const { requireMember } = require('../lib/auth');
const { isValidUuid } = require('../lib/validation');

// Vienna timezone date for accurate past-session checks
function viennaToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' });
}

module.exports = async (req, res) => {
  setCors(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = requireMember(req, res);
  if (!payload) return;

  const sql = getDb();
  const userId = payload.sub;

  // ── GET: read operations ──
  if (req.method === 'GET') {
    const view = req.query.view || 'upcoming';

    // Upcoming sessions (next 4 weeks) with user's RSVP status
    if (view === 'upcoming') {
      try {
        const sessions = await sql`
          SELECT
            s.id, s.title, s.description, s.location,
            s.session_date, s.start_time, s.end_time,
            s.max_capacity, s.is_cancelled,
            a.status AS my_status,
            (SELECT COUNT(*) FROM training_attendance WHERE session_id = s.id AND status = 'attending') AS attending_count,
            (SELECT COUNT(*) FROM training_attendance WHERE session_id = s.id AND status = 'not_attending') AS not_attending_count
          FROM training_sessions s
          LEFT JOIN training_attendance a ON a.session_id = s.id AND a.user_id = ${userId}
          WHERE s.session_date >= (NOW() AT TIME ZONE 'Europe/Vienna')::date
            AND s.session_date <= (NOW() AT TIME ZONE 'Europe/Vienna')::date + INTERVAL '28 days'
          ORDER BY s.session_date ASC, s.start_time ASC
        `;
        return res.status(200).json({ sessions });
      } catch {
        return res.status(500).json({ error: 'Failed to load sessions', code: 'SERVER_ERROR' });
      }
    }

    // Single session detail with attendee list
    if (view === 'session') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Session id required', code: 'VALIDATION_ERROR' });
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Invalid session id format', code: 'VALIDATION_ERROR' });

      try {
        const sessions = await sql`
          SELECT
            s.id, s.title, s.description, s.location,
            s.session_date, s.start_time, s.end_time,
            s.max_capacity, s.is_cancelled,
            a.status AS my_status
          FROM training_sessions s
          LEFT JOIN training_attendance a ON a.session_id = s.id AND a.user_id = ${userId}
          WHERE s.id = ${id}
        `;
        if (sessions.length === 0) {
          return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
        }

        const attendees = await sql`
          SELECT u.display_name, ta.status
          FROM training_attendance ta
          JOIN users u ON u.id = ta.user_id
          WHERE ta.session_id = ${id} AND ta.status IN ('attending', 'not_attending')
          ORDER BY ta.status ASC, u.display_name ASC
        `;

        return res.status(200).json({ session: sessions[0], attendees });
      } catch {
        return res.status(500).json({ error: 'Failed to load session', code: 'SERVER_ERROR' });
      }
    }

    return res.status(400).json({ error: 'Invalid view parameter', code: 'VALIDATION_ERROR' });
  }

  // ── POST: RSVP ──
  if (req.method === 'POST') {
    const { action, session_id, status } = req.body || {};

    if (action !== 'rsvp') {
      return res.status(400).json({ error: 'Invalid action', code: 'VALIDATION_ERROR' });
    }
    if (!session_id || !['attending', 'not_attending'].includes(status)) {
      return res.status(400).json({ error: 'session_id and status (attending/not_attending) required', code: 'VALIDATION_ERROR' });
    }
    if (!isValidUuid(session_id)) {
      return res.status(400).json({ error: 'Invalid session_id format', code: 'VALIDATION_ERROR' });
    }

    try {
      // Verify session exists, is not cancelled, and is not in the past
      const sessions = await sql`
        SELECT id, is_cancelled, session_date, max_capacity FROM training_sessions WHERE id = ${session_id}
      `;
      if (sessions.length === 0) {
        return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
      }
      if (sessions[0].is_cancelled) {
        return res.status(400).json({ error: 'Cannot RSVP to a cancelled session', code: 'SESSION_CANCELLED' });
      }
      const sessionDate = typeof sessions[0].session_date === 'string'
        ? sessions[0].session_date.slice(0, 10)
        : sessions[0].session_date.toISOString().slice(0, 10);
      if (sessionDate < viennaToday()) {
        return res.status(400).json({ error: 'Cannot RSVP to a past session', code: 'SESSION_PAST' });
      }
      // Atomic capacity check + upsert in a single transaction
      if (status === 'attending' && sessions[0].max_capacity) {
        const result = await sql`
          WITH current_count AS (
            SELECT COUNT(*) AS cnt FROM training_attendance
            WHERE session_id = ${session_id} AND status = 'attending' AND user_id != ${userId}
          )
          INSERT INTO training_attendance (session_id, user_id, status, responded_at)
          SELECT ${session_id}, ${userId}::uuid, ${status}, NOW()
          FROM current_count
          WHERE current_count.cnt < ${sessions[0].max_capacity}
          ON CONFLICT (session_id, user_id)
          DO UPDATE SET status = ${status}, responded_at = NOW()
          WHERE (SELECT cnt FROM current_count) < ${sessions[0].max_capacity}
          RETURNING session_id
        `;
        if (result.length === 0) {
          return res.status(400).json({ error: 'Session is full', code: 'CAPACITY_FULL' });
        }
      } else {
        // Non-capacity-limited upsert
        await sql`
          INSERT INTO training_attendance (session_id, user_id, status, responded_at)
          VALUES (${session_id}, ${userId}, ${status}, NOW())
          ON CONFLICT (session_id, user_id)
          DO UPDATE SET status = ${status}, responded_at = NOW()
        `;
      }

      // Return updated counts
      const counts = await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'attending') AS attending_count,
          COUNT(*) FILTER (WHERE status = 'not_attending') AS not_attending_count
        FROM training_attendance WHERE session_id = ${session_id}
      `;

      return res.status(200).json({
        success: true,
        my_status: status,
        attending_count: parseInt(counts[0].attending_count) || 0,
        not_attending_count: parseInt(counts[0].not_attending_count) || 0
      });
    } catch {
      return res.status(500).json({ error: 'RSVP failed', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
