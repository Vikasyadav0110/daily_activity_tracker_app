-- =============================================================================
-- Phase 1 — SQLite Schema (Daily Activity Tracker)
-- Database: Expo SQLite (on-device, offline-first)
-- Tables: 8 (activities, activity_logs, streaks, exam_prep, exam_logs,
--             mock_tests, badges, app_settings)
-- Actual migration file: src/services/db/migrations/001_initial.sql
-- This file is the canonical spec / reference DDL for Phase 1.
-- =============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

-- ---------------------------------------------------------------------------
-- 1. activities
-- Core entity. Every tracked habit, exam goal, or spiritual practice.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          TEXT,                                    -- NULL in Phase 1; filled on Phase 2 cloud sync
    name             TEXT    NOT NULL,                        -- "Gym", "Constitutional Law", "Pranayama"
    category         TEXT    NOT NULL,                        -- Fitness | Study | Spiritual | Wellness | Work | Custom
    icon             TEXT    NOT NULL DEFAULT '⚡',           -- Emoji or icon identifier
    frequency        TEXT    NOT NULL DEFAULT 'daily',        -- "daily" | "weekly:1,3,5" | "monthly:1,15"
    target_duration  INTEGER,                                 -- Target minutes per session (nullable)
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    is_archived      INTEGER NOT NULL DEFAULT 0               -- 0 = active, 1 = archived (soft-delete)
);

CREATE INDEX IF NOT EXISTS idx_activities_archived ON activities(is_archived);


-- ---------------------------------------------------------------------------
-- 2. activity_logs
-- One row per activity per calendar day. The atomic check-off record.
-- UNIQUE constraint prevents duplicate log per (activity, date) pair.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id      INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    log_date         TEXT    NOT NULL,                        -- YYYY-MM-DD in Asia/Kolkata
    duration_minutes INTEGER,                                 -- Actual session duration (nullable)
    quantity         REAL,                                    -- For quantity tracking (e.g. 8 glasses water)
    status           TEXT    NOT NULL DEFAULT 'completed',    -- completed | skipped | missed
    notes            TEXT,                                    -- Optional user note
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (activity_id, log_date)                            -- One log per activity per day
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_date     ON activity_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON activity_logs(activity_id);


-- ---------------------------------------------------------------------------
-- 3. streaks
-- One row per activity. Maintains live streak state including 48h forgiveness.
-- UNIQUE on activity_id enforces the one-streak-per-activity invariant.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaks (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id          INTEGER NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    current_streak_days  INTEGER NOT NULL DEFAULT 0,          -- Active streak length
    longest_streak_days  INTEGER NOT NULL DEFAULT 0,          -- All-time best
    streak_start_date    TEXT,                                 -- YYYY-MM-DD when current streak began
    last_logged_date     TEXT,                                 -- YYYY-MM-DD of most recent log
    forgiveness_used     INTEGER NOT NULL DEFAULT 0           -- 0 = grace available | 1 = grace consumed
    -- Business rule: forgiveness_used resets to 0 when user logs after grace.
    -- If forgiveness_used = 1 and user misses again, streak resets to 0.
);


-- ---------------------------------------------------------------------------
-- 4. exam_prep
-- One row per exam-mode activity. Stores exam type, subjects JSON, coverage %.
-- subjects stored as JSON TEXT: [{"name":"Polity","completion":45}]
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_prep (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id             INTEGER NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    exam_type               TEXT    NOT NULL,                  -- UPSC | JEE | NEET | SSC | Banking
    subjects                TEXT    NOT NULL DEFAULT '[]',     -- JSON array: [{"name":"...","completion":0}]
    exam_date               TEXT,                              -- YYYY-MM-DD target date (nullable)
    syllabus_coverage_pct   INTEGER NOT NULL DEFAULT 0         -- Overall coverage 0–100
);


-- ---------------------------------------------------------------------------
-- 5. exam_logs
-- Study session records linked to an exam_prep entry.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id       INTEGER NOT NULL REFERENCES exam_prep(id) ON DELETE CASCADE,
    subject       TEXT    NOT NULL,                            -- "Constitutional Law", "Organic Chemistry"
    study_hours   REAL    NOT NULL DEFAULT 0,                  -- Hours studied (fractional e.g. 2.5)
    difficulty    TEXT    NOT NULL DEFAULT 'medium',           -- easy | medium | hard
    log_date      TEXT    NOT NULL,                            -- YYYY-MM-DD
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exam_logs_exam_date ON exam_logs(exam_id, log_date);


-- ---------------------------------------------------------------------------
-- 6. mock_tests
-- Mock test score records with trend support.
-- score_pct is computed in app: (score / total_marks) * 100 — not stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_tests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id      INTEGER NOT NULL REFERENCES exam_prep(id) ON DELETE CASCADE,
    subject      TEXT,                                         -- NULL = full syllabus test
    score        INTEGER NOT NULL,                             -- Raw score achieved
    total_marks  INTEGER NOT NULL,                             -- Maximum possible marks
    test_date    TEXT    NOT NULL,                             -- YYYY-MM-DD
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_exam ON mock_tests(exam_id, test_date);


-- ---------------------------------------------------------------------------
-- 7. badges
-- Gamification. Pre-seeded rows for all possible badges; is_earned flips
-- when the badge is unlocked. activity_id = NULL means global badge.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL, -- NULL = global badge
    badge_key   TEXT    NOT NULL UNIQUE,                       -- Stable ID: "streak_7", "first_checkoff"
    badge_name  TEXT    NOT NULL,                              -- Display name: "7-Day Streaker"
    badge_icon  TEXT    NOT NULL DEFAULT '🏅',                -- Emoji or icon ref
    unlocked_at TEXT,                                          -- ISO-8601 timestamp; NULL = not yet earned
    is_earned   INTEGER NOT NULL DEFAULT 0                     -- 0 = locked | 1 = unlocked
);

-- Seed all possible badges. Locked by default (is_earned = 0).
INSERT OR IGNORE INTO badges (badge_key, badge_name, badge_icon) VALUES
    ('first_checkoff',    'First Step',           '👣'),
    ('streak_3',          '3-Day Streaker',        '🔥'),
    ('streak_7',          '7-Day Streaker',        '🔥'),
    ('streak_14',         '2-Week Warrior',        '💪'),
    ('streak_30',         '30-Day Champion',       '🏆'),
    ('streak_100',        'Century Club',          '💯'),
    ('studied_10_hours',  '10-Hour Scholar',       '📚'),
    ('studied_50_hours',  '50-Hour Scholar',       '🎓'),
    ('studied_100_hours', 'Century Scholar',       '🦉'),
    ('mock_test_first',   'First Mock',            '📝'),
    ('mock_test_ace',     'Mock Ace (90%+)',        '⭐'),
    ('syllabus_50',       '50% Syllabus Done',     '📖'),
    ('syllabus_100',      'Syllabus Complete',     '✅'),
    ('activities_5',      '5 Active Habits',       '🎯');


-- ---------------------------------------------------------------------------
-- 8. app_settings
-- Single-row preferences store (id always = 1).
-- reminder_times: JSON [{"activity_id":1,"time":"08:00"}]
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id               TEXT,                                -- NULL until Phase 2 cloud account created
    language              TEXT    NOT NULL DEFAULT 'en',       -- en | hi | ta | te | bn
    theme                 TEXT    NOT NULL DEFAULT 'light',    -- light | dark
    timezone              TEXT    NOT NULL DEFAULT 'Asia/Kolkata',
    notification_enabled  INTEGER NOT NULL DEFAULT 1,          -- 1 = enabled | 0 = disabled
    reminder_times        TEXT    NOT NULL DEFAULT '[]',       -- JSON: [{"activity_id":1,"time":"08:00"}]
    onboarding_complete   INTEGER NOT NULL DEFAULT 0,          -- 0 = not done | 1 = completed
    created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Insert the single default settings row on first migration.
INSERT OR IGNORE INTO app_settings (id) VALUES (1);
