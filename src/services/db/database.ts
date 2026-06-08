import * as SQLite from 'expo-sqlite';

const DB_NAME = 'daily_activity_tracker.db';
const CURRENT_SCHEMA_VERSION = 1;

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
}

async function runMigrations(
  database: SQLite.SQLiteDatabase,
  fromVersion: number
): Promise<void> {
  await database.withTransactionAsync(async () => {
    if (fromVersion < 1) {
      await applyMigration001(database);
    }
    // Future migrations: if (fromVersion < 2) { await applyMigration002(database); }
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

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
