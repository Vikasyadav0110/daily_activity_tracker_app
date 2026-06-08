-- Daily Activity Tracker — Initial Schema (v1)
-- SQLite, Phase 1 (offline-only)
-- user_version = 1

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  frequency TEXT NOT NULL DEFAULT 'daily',
  -- frequency values: "daily" | "weekly:1,3,5" (weekdays 0=Sun,1=Mon...) | "monthly:1,15"
  target_duration INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,        -- YYYY-MM-DD in IST
  duration_minutes INTEGER,
  quantity REAL,
  status TEXT NOT NULL DEFAULT 'completed',   -- completed | skipped | missed
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE(activity_id, log_date)              -- prevents duplicate logs per day
);

CREATE TABLE IF NOT EXISTS streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL UNIQUE,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  streak_start_date TEXT,        -- YYYY-MM-DD
  last_logged_date TEXT,         -- YYYY-MM-DD
  forgiveness_used INTEGER NOT NULL DEFAULT 0,  -- 0=false, 1=true (per cycle)
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_prep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL UNIQUE,
  exam_type TEXT NOT NULL,       -- UPSC | JEE | NEET | SSC | Banking
  subjects TEXT NOT NULL DEFAULT '[]',  -- JSON: [{"name":"Polity","completion":45}]
  exam_date TEXT,                -- YYYY-MM-DD
  syllabus_coverage_pct INTEGER NOT NULL DEFAULT 0,  -- 0-100
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  study_hours REAL NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- easy | medium | hard
  log_date TEXT NOT NULL,        -- YYYY-MM-DD
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mock_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject TEXT,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  test_date TEXT NOT NULL,       -- YYYY-MM-DD
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER,           -- NULL for global badges
  badge_key TEXT NOT NULL UNIQUE,  -- streak_7 | streak_30 | studied_100_hours
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏅',
  unlocked_at TEXT,              -- NULL if not yet earned
  is_earned INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',    -- en | hi | ta | te | bn
  theme TEXT NOT NULL DEFAULT 'light',    -- light | dark
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  notification_enabled INTEGER NOT NULL DEFAULT 1,
  reminder_times TEXT NOT NULL DEFAULT '[]',  -- JSON: [{"activity_id":1,"time":"08:00"}]
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON activity_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_exam_logs_exam_date ON exam_logs(exam_id, log_date);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam ON mock_tests(exam_id, test_date);
CREATE INDEX IF NOT EXISTS idx_activities_archived ON activities(is_archived);

-- Seed default app settings row (only if empty)
INSERT OR IGNORE INTO app_settings (id, language, theme) VALUES (1, 'en', 'light');

PRAGMA user_version = 1;
