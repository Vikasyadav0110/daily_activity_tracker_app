import { getDatabase } from './database';

export interface Badge {
  id: number;
  activity_id: number | null;
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  unlocked_at: string | null;
  is_earned: boolean;
}

export const DEFAULT_BADGES: Omit<Badge, 'id' | 'is_earned' | 'unlocked_at'>[] = [
  // First action
  { activity_id: null, badge_key: 'first_checkoff',  badge_name: 'First Step',         badge_icon: '🌱' },
  // Streaks
  { activity_id: null, badge_key: 'streak_3',        badge_name: '3-Day Habit',        badge_icon: '✨' },
  { activity_id: null, badge_key: 'streak_7',        badge_name: '7-Day Warrior',      badge_icon: '🔥' },
  { activity_id: null, badge_key: 'streak_14',       badge_name: '2-Week Streak',      badge_icon: '💪' },
  { activity_id: null, badge_key: 'streak_30',       badge_name: '30-Day Champion',    badge_icon: '🏆' },
  { activity_id: null, badge_key: 'streak_100',      badge_name: '100-Day Legend',     badge_icon: '👑' },
  // Study hours
  { activity_id: null, badge_key: 'studied_10h',     badge_name: '10 Hours Studied',   badge_icon: '📚' },
  { activity_id: null, badge_key: 'studied_50h',     badge_name: '50 Hours Scholar',   badge_icon: '📖' },
  { activity_id: null, badge_key: 'studied_100h',    badge_name: 'Century Scholar',    badge_icon: '🎓' },
  // Exam / mock test
  { activity_id: null, badge_key: 'mock_test_first', badge_name: 'First Mock Test',    badge_icon: '📝' },
  { activity_id: null, badge_key: 'mock_test_ace',   badge_name: 'Mock Test Ace',      badge_icon: '⭐' },
  // Syllabus
  { activity_id: null, badge_key: 'syllabus_50',     badge_name: 'Halfway There',      badge_icon: '📋' },
  { activity_id: null, badge_key: 'syllabus_100',    badge_name: 'Syllabus Complete',  badge_icon: '🎯' },
  // Activities count
  { activity_id: null, badge_key: 'activities_5',    badge_name: 'Five-Timer',         badge_icon: '⚡' },
];

export async function seedDefaultBadges(): Promise<void> {
  const db = await getDatabase();
  for (const badge of DEFAULT_BADGES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO badges (activity_id, badge_key, badge_name, badge_icon)
       VALUES (?, ?, ?, ?)`,
      [badge.activity_id, badge.badge_key, badge.badge_name, badge.badge_icon]
    );
  }
}

export async function getAllBadges(): Promise<Badge[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Badge>(
    `SELECT * FROM badges ORDER BY is_earned DESC, badge_key ASC`
  );
  return rows.map(normalizeBadge);
}

export async function getBadges(activityId?: number): Promise<Badge[]> {
  const db = await getDatabase();
  if (activityId !== undefined) {
    const rows = await db.getAllAsync<Badge>(
      `SELECT * FROM badges WHERE activity_id = ? OR activity_id IS NULL ORDER BY is_earned DESC`,
      [activityId]
    );
    return rows.map(normalizeBadge);
  }
  const rows = await db.getAllAsync<Badge>(`SELECT * FROM badges ORDER BY is_earned DESC`);
  return rows.map(normalizeBadge);
}

export async function getEarnedBadges(): Promise<Badge[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Badge>(
    `SELECT * FROM badges WHERE is_earned = 1 ORDER BY unlocked_at DESC`
  );
  return rows.map(normalizeBadge);
}

export async function unlockBadge(badgeKey: string): Promise<Badge | null> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<Badge>(
    `SELECT * FROM badges WHERE badge_key = ?`,
    [badgeKey]
  );
  if (!existing) return null;
  if (existing.is_earned) return normalizeBadge(existing);

  await db.runAsync(
    `UPDATE badges SET is_earned = 1, unlocked_at = datetime('now') WHERE badge_key = ?`,
    [badgeKey]
  );
  const updated = await db.getFirstAsync<Badge>(
    `SELECT * FROM badges WHERE badge_key = ?`,
    [badgeKey]
  );
  return updated ? normalizeBadge(updated) : null;
}

function normalizeBadge(row: Badge): Badge {
  return {
    ...row,
    is_earned: row.is_earned === true || (row.is_earned as unknown as number) === 1,
  };
}
