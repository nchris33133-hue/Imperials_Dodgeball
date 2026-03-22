/**
 * Migration: Add missing database indexes for query performance.
 *
 * Safe to run multiple times — every statement uses IF NOT EXISTS.
 *
 * Usage:
 *   node tools/migrate-add-indexes.js
 *
 * Requires DATABASE_URL (or POSTGRES_URL) in environment or .env file.
 */

// Load .env manually (no dotenv dependency)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
const { getDb } = require('../lib/db');

const INDEXES = [
  {
    name: 'idx_users_email',
    sql: `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
    reason: 'Login lookups: WHERE email = $1',
  },
  {
    name: 'idx_login_attempts_email_window',
    sql: `CREATE INDEX IF NOT EXISTS idx_login_attempts_email_window ON login_attempts (email_hash, window_start)`,
    reason: 'Rate-limit checks: WHERE email_hash = $1 AND window_start > $2',
  },
  {
    name: 'idx_training_attendance_session_user',
    sql: `CREATE INDEX IF NOT EXISTS idx_training_attendance_session_user ON training_attendance (session_id, user_id)`,
    reason: 'RSVP lookups & ON CONFLICT: (session_id, user_id) — may already exist via UNIQUE constraint',
  },
  {
    name: 'idx_training_attendance_session_status',
    sql: `CREATE INDEX IF NOT EXISTS idx_training_attendance_session_status ON training_attendance (session_id, status)`,
    reason: 'Attendance counts: WHERE session_id = $1 AND status = attending/not_attending',
  },
  {
    name: 'idx_training_sessions_session_date',
    sql: `CREATE INDEX IF NOT EXISTS idx_training_sessions_session_date ON training_sessions (session_date)`,
    reason: 'Upcoming/past session filters: WHERE session_date >= $1 / session_date = $1',
  },
  {
    name: 'idx_refresh_tokens_user_expires',
    sql: `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires ON refresh_tokens (user_id, expires_at)`,
    reason: 'Token cleanup & lookup: WHERE user_id = $1, WHERE expires_at > NOW()',
  },
];

async function main() {
  const sql = getDb();

  console.log(`\nMigration: add missing indexes (${INDEXES.length} total)\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const idx of INDEXES) {
    try {
      console.log(`  [+] ${idx.name}`);
      console.log(`      ${idx.reason}`);
      await sql.query(idx.sql);
      console.log(`      -> OK\n`);
      created++;
    } catch (err) {
      // IF NOT EXISTS should prevent most errors, but log any that slip through
      console.error(`      -> FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`Done. Created/verified: ${created}, Failed: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
