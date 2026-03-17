const { getDb } = require('../../lib/db');
const { setCors } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  setCors(req, res, 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const sql = getDb();

  // ── GET: read operations ──
  if (req.method === 'GET') {
    const view = req.query.view || 'overview';

    // Overview: all sessions with attendance counts
    if (view === 'overview') {
      const range = req.query.range || 'month';
      const interval = range === 'week' ? '7 days' : '30 days';
      try {
        const sessions = await sql`
          SELECT
            s.*,
            (SELECT COUNT(*) FROM training_attendance WHERE session_id = s.id AND status = 'attending') AS attending_count,
            (SELECT COUNT(*) FROM training_attendance WHERE session_id = s.id AND status = 'not_attending') AS not_attending_count,
            (SELECT COUNT(*) FROM users WHERE is_active = true AND status = 'approved') -
              (SELECT COUNT(*) FROM training_attendance WHERE session_id = s.id AND status IN ('attending', 'not_attending')) AS no_response_count
          FROM training_sessions s
          WHERE s.session_date >= (NOW() AT TIME ZONE 'Europe/Vienna')::date - INTERVAL ${interval}
          ORDER BY s.session_date ASC, s.start_time ASC
        `;
        return res.status(200).json({ sessions });
      } catch (err) {
        console.error('ADMIN TRAINING: overview error', err.message);
        return res.status(500).json({ error: 'Failed to load sessions', code: 'SERVER_ERROR' });
      }
    }

    // Detail: single session with full attendee breakdown
    if (view === 'detail') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Session id required', code: 'VALIDATION_ERROR' });

      try {
        const sessions = await sql`SELECT * FROM training_sessions WHERE id = ${id}`;
        if (sessions.length === 0) {
          return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
        }

        const attendees = await sql`
          SELECT u.id, u.display_name, u.email, COALESCE(ta.status, 'pending') AS status, ta.responded_at
          FROM users u
          LEFT JOIN training_attendance ta ON ta.user_id = u.id AND ta.session_id = ${id}
          WHERE u.is_active = true AND u.status = 'approved'
          ORDER BY
            CASE COALESCE(ta.status, 'pending')
              WHEN 'attending' THEN 1
              WHEN 'not_attending' THEN 2
              ELSE 3
            END,
            u.display_name ASC
        `;

        return res.status(200).json({ session: sessions[0], attendees });
      } catch (err) {
        console.error('ADMIN TRAINING: detail error', err.message);
        return res.status(500).json({ error: 'Failed to load session detail', code: 'SERVER_ERROR' });
      }
    }

    // Attendance matrix: members x sessions
    if (view === 'matrix') {
      try {
        const sessions = await sql`
          SELECT id, title, session_date
          FROM training_sessions
          WHERE session_date >= (NOW() AT TIME ZONE 'Europe/Vienna')::date - INTERVAL '60 days'
          ORDER BY session_date ASC
        `;

        const members = await sql`
          SELECT u.id, u.display_name
          FROM users u
          WHERE u.is_active = true AND u.status = 'approved'
          ORDER BY u.display_name ASC
        `;

        const attendance = await sql`
          SELECT session_id, user_id, status
          FROM training_attendance
          WHERE session_id IN (
            SELECT id FROM training_sessions
            WHERE session_date >= (NOW() AT TIME ZONE 'Europe/Vienna')::date - INTERVAL '60 days'
          )
        `;

        // Build lookup
        const lookup = {};
        for (const a of attendance) {
          lookup[`${a.user_id}_${a.session_id}`] = a.status;
        }

        const matrix = members.map(m => ({
          id: m.id,
          display_name: m.display_name,
          sessions: sessions.map(s => ({
            session_id: s.id,
            status: lookup[`${m.id}_${s.id}`] || 'pending'
          }))
        }));

        // Calculate overall attendance rate
        const totalSlots = members.length * sessions.length;
        const attendingCount = attendance.filter(a => a.status === 'attending').length;
        const attendance_rate = totalSlots > 0 ? Math.round((attendingCount / totalSlots) * 100) : 0;

        return res.status(200).json({ sessions, matrix, attendance_rate });
      } catch (err) {
        console.error('ADMIN TRAINING: matrix error', err.message);
        return res.status(500).json({ error: 'Failed to load attendance matrix', code: 'SERVER_ERROR' });
      }
    }

    return res.status(400).json({ error: 'Invalid view parameter', code: 'VALIDATION_ERROR' });
  }

  // ── POST: create / update / cancel / generate ──
  if (req.method === 'POST') {
    const { action } = req.body || {};

    // Create session
    if (action === 'create') {
      const { title, description, location, session_date, start_time, end_time, max_capacity } = req.body;
      if (!title || !session_date || !start_time || !end_time) {
        return res.status(400).json({ error: 'title, session_date, start_time, and end_time are required', code: 'VALIDATION_ERROR' });
      }
      try {
        const result = await sql`
          INSERT INTO training_sessions (title, description, location, session_date, start_time, end_time, max_capacity)
          VALUES (${title}, ${description || null}, ${location || null}, ${session_date}, ${start_time}, ${end_time}, ${max_capacity || null})
          RETURNING *
        `;
        console.log(`ADMIN TRAINING: created session ${result[0].id}`);
        return res.status(201).json({ session: result[0] });
      } catch (err) {
        console.error('ADMIN TRAINING: create error', err.message);
        return res.status(500).json({ error: 'Failed to create session', code: 'SERVER_ERROR' });
      }
    }

    // Update session
    if (action === 'update') {
      const { id, title, description, location, session_date, start_time, end_time, max_capacity } = req.body;
      if (!id) return res.status(400).json({ error: 'Session id required', code: 'VALIDATION_ERROR' });
      try {
        const result = await sql`
          UPDATE training_sessions SET
            title = COALESCE(${title || null}, title),
            description = COALESCE(${description !== undefined ? description : null}, description),
            location = COALESCE(${location !== undefined ? location : null}, location),
            session_date = COALESCE(${session_date || null}, session_date),
            start_time = COALESCE(${start_time || null}, start_time),
            end_time = COALESCE(${end_time || null}, end_time),
            max_capacity = COALESCE(${max_capacity !== undefined ? max_capacity : null}, max_capacity),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
        console.log(`ADMIN TRAINING: updated session ${id}`);
        return res.status(200).json({ session: result[0] });
      } catch (err) {
        console.error('ADMIN TRAINING: update error', err.message);
        return res.status(500).json({ error: 'Failed to update session', code: 'SERVER_ERROR' });
      }
    }

    // Cancel session
    if (action === 'cancel') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Session id required', code: 'VALIDATION_ERROR' });
      try {
        const result = await sql`
          UPDATE training_sessions SET is_cancelled = true, updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
        console.log(`ADMIN TRAINING: cancelled session ${id}`);
        return res.status(200).json({ session: result[0] });
      } catch (err) {
        console.error('ADMIN TRAINING: cancel error', err.message);
        return res.status(500).json({ error: 'Failed to cancel session', code: 'SERVER_ERROR' });
      }
    }

    // Generate recurring sessions
    if (action === 'generate') {
      const { title, description, location, recurring_day, start_time, end_time, weeks, max_capacity } = req.body;
      if (recurring_day === undefined || !start_time || !end_time || !weeks) {
        return res.status(400).json({ error: 'recurring_day, start_time, end_time, and weeks are required', code: 'VALIDATION_ERROR' });
      }
      if (weeks < 1 || weeks > 52) {
        return res.status(400).json({ error: 'weeks must be between 1 and 52', code: 'VALIDATION_ERROR' });
      }

      try {
        // Find the next occurrence of the recurring_day (0=Sun..6=Sat)
        const today = new Date();
        const todayDay = today.getDay();
        let daysUntilNext = (recurring_day - todayDay + 7) % 7;
        if (daysUntilNext === 0) daysUntilNext = 7; // start from next week

        const sessions = [];
        for (let w = 0; w < weeks; w++) {
          const d = new Date(today);
          d.setDate(d.getDate() + daysUntilNext + (w * 7));
          const dateStr = d.toISOString().split('T')[0];

          const sessionTitle = title || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][recurring_day] + ' Training';

          const result = await sql`
            INSERT INTO training_sessions (title, description, location, session_date, start_time, end_time, recurring_day, max_capacity)
            VALUES (${sessionTitle}, ${description || null}, ${location || null}, ${dateStr}, ${start_time}, ${end_time}, ${recurring_day}, ${max_capacity || null})
            RETURNING *
          `;
          sessions.push(result[0]);
        }

        console.log(`ADMIN TRAINING: generated ${sessions.length} recurring sessions`);
        return res.status(201).json({ sessions, count: sessions.length });
      } catch (err) {
        console.error('ADMIN TRAINING: generate error', err.message);
        return res.status(500).json({ error: 'Failed to generate sessions', code: 'SERVER_ERROR' });
      }
    }

    return res.status(400).json({ error: 'Invalid action', code: 'VALIDATION_ERROR' });
  }

  // ── DELETE: remove session ──
  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Session id required', code: 'VALIDATION_ERROR' });

    try {
      const result = await sql`DELETE FROM training_sessions WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
      console.log(`ADMIN TRAINING: deleted session ${id}`);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('ADMIN TRAINING: delete error', err.message);
      return res.status(500).json({ error: 'Failed to delete session', code: 'SERVER_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
};
