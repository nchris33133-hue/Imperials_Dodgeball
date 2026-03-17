-- Vienna Imperials Member System Schema
-- Run via: node api/data/migrate.js

CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                VARCHAR(255) UNIQUE NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  display_name         VARCHAR(100) NOT NULL,
  ranking_player_name  VARCHAR(100),
  is_email_verified    BOOLEAN DEFAULT FALSE,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  last_login           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Member approval status
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT FALSE;
UPDATE users SET status = 'approved' WHERE is_active = TRUE;
UPDATE users SET status = 'pending' WHERE is_active = FALSE;

CREATE TABLE IF NOT EXISTS login_attempts (
  email_hash    VARCHAR(64) NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (email_hash)
);

CREATE TABLE IF NOT EXISTS rankings_data (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Training sessions created by admin
CREATE TABLE IF NOT EXISTS training_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  location        VARCHAR(200),
  session_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  recurring_day   INTEGER,
  max_capacity    INTEGER,
  is_cancelled    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON training_sessions(session_date);

-- Member attendance votes
CREATE TABLE IF NOT EXISTS training_attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON training_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON training_attendance(user_id);
