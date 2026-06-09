import * as SQLite from 'expo-sqlite';
import { seedDefaultBadges } from './badgesRepo';

const DB_NAME = 'daily_activity_tracker.db';
const CURRENT_SCHEMA_VERSION = 4;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync('PRAGMA foreign_keys = ON;');

  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    await runMigrations(database, currentVersion);
  }

  await seedDefaultBadges();
}

async function runMigrations(
  database: SQLite.SQLiteDatabase,
  fromVersion: number
): Promise<void> {
  await database.withTransactionAsync(async () => {
    if (fromVersion < 1) {
      await applyMigration001(database);
    }
    if (fromVersion < 2) {
      await applyMigration002(database);
    }
    if (fromVersion < 3) {
      await applyMigration003(database);
    }
    if (fromVersion < 4) {
      await applyMigration004(database);
    }
  });
}

async function applyMigration001(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '⚡',
      frequency TEXT NOT NULL DEFAULT 'daily',
      target_duration INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      log_date TEXT NOT NULL,
      duration_minutes INTEGER,
      quantity REAL,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      UNIQUE(activity_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL UNIQUE,
      current_streak_days INTEGER NOT NULL DEFAULT 0,
      longest_streak_days INTEGER NOT NULL DEFAULT 0,
      streak_start_date TEXT,
      last_logged_date TEXT,
      forgiveness_used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_prep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL UNIQUE,
      exam_type TEXT NOT NULL,
      subjects TEXT NOT NULL DEFAULT '[]',
      exam_date TEXT,
      syllabus_coverage_pct INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      study_hours REAL NOT NULL DEFAULT 0,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      log_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exam_id) REFERENCES exam_prep(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mock_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      subject TEXT,
      score INTEGER NOT NULL,
      total_marks INTEGER NOT NULL,
      test_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exam_id) REFERENCES exam_prep(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER,
      badge_key TEXT NOT NULL UNIQUE,
      badge_name TEXT NOT NULL,
      badge_icon TEXT NOT NULL DEFAULT '🏅',
      unlocked_at TEXT,
      is_earned INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      language TEXT NOT NULL DEFAULT 'en',
      theme TEXT NOT NULL DEFAULT 'light',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      notification_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_times TEXT NOT NULL DEFAULT '[]',
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(log_date);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON activity_logs(activity_id);
    CREATE INDEX IF NOT EXISTS idx_exam_logs_exam_date ON exam_logs(exam_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_mock_tests_exam ON mock_tests(exam_id, test_date);
    CREATE INDEX IF NOT EXISTS idx_activities_archived ON activities(is_archived);

    INSERT OR IGNORE INTO app_settings (id, language, theme) VALUES (1, 'en', 'light');

    PRAGMA user_version = 1;
  `);
}

async function applyMigration002(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_xp (
      id INTEGER PRIMARY KEY DEFAULT 1,
      total_xp INTEGER NOT NULL DEFAULT 0,
      week_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 0,
      week_reset_date TEXT NOT NULL DEFAULT (date('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER,
      event_type TEXT NOT NULL,
      xp_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO user_xp (id, total_xp, week_xp, level) VALUES (1, 0, 0, 0);

    CREATE INDEX IF NOT EXISTS idx_xp_events_created ON xp_events(created_at);

    PRAGMA user_version = 2;
  `);
}

async function applyMigration003(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS local_subscription (
      id INTEGER PRIMARY KEY DEFAULT 1,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'inactive',
      expires_at TEXT,
      razorpay_subscription_id TEXT,
      razorpay_payment_id TEXT,
      verified_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO local_subscription (id, plan, status) VALUES (1, 'free', 'inactive');

    PRAGMA user_version = 3;
  `);
}

async function applyMigration004(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mood_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      mood_rating INTEGER NOT NULL CHECK(mood_rating BETWEEN 1 AND 5),
      energy_level INTEGER NOT NULL CHECK(energy_level BETWEEN 1 AND 5),
      sleep_quality INTEGER CHECK(sleep_quality BETWEEN 1 AND 5),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(date)
    );

    CREATE TABLE IF NOT EXISTS fasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vrat_name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      mood_rating INTEGER CHECK(mood_rating BETWEEN 1 AND 5),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mantra_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mantra_name TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      duration_minutes INTEGER,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      insight_week_start TEXT NOT NULL,
      insight_type TEXT NOT NULL DEFAULT 'weekly_review',
      insight_title TEXT NOT NULL,
      insight_text TEXT NOT NULL,
      insight_data TEXT,
      xp_reward INTEGER NOT NULL DEFAULT 50,
      was_acted_upon INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      viewed_at TEXT,
      UNIQUE(insight_week_start, insight_type)
    );

    CREATE TABLE IF NOT EXISTS ai_coach_messages (
      id TEXT PRIMARY KEY,
      message_type TEXT NOT NULL,
      message_text TEXT NOT NULL,
      triggered_reason TEXT,
      was_sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      was_opened INTEGER NOT NULL DEFAULT 0,
      user_acted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_plans (
      id TEXT PRIMARY KEY,
      plan_name TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      plan_type TEXT NOT NULL DEFAULT 'ai_generated',
      status TEXT NOT NULL DEFAULT 'active',
      adherence_rate REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wellness_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip_text TEXT NOT NULL,
      tip_text_hi TEXT,
      tip_category TEXT NOT NULL DEFAULT 'general_wellness',
      season TEXT,
      dosha TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dosha_profiles (
      id INTEGER PRIMARY KEY DEFAULT 1,
      primary_dosha TEXT NOT NULL DEFAULT 'vata',
      secondary_dosha TEXT,
      determined_via TEXT NOT NULL DEFAULT 'quiz',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    PRAGMA user_version = 4;
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
