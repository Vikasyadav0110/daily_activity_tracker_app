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
  { activity_id: null, badge_key: 'streak_7',        badge_name: '7-Day Warrior',    badge_icon: '🔥' },
  { activity_id: null, badge_key: 'streak_30',       badge_name: '30-Day Champion',  badge_icon: '🏆' },
  { activity_id: null, badge_key: 'streak_100',      badge_name: '100-Day Legend',   badge_icon: '👑' },
  { activity_id: null, badge_key: 'first_log',       badge_name: 'First Step',       badge_icon: '🌱' },
  { activity_id: null, badge_key: 'studied_10h',     badge_name: '10 Hours Studied', badge_icon: '📚' },
  { activity_id: null, badge_key: 'studied_100h',    badge_name: 'Century Scholar',  badge_icon: '🎓' },
  { activity_id: null, badge_key: 'activities_3',    badge_name: 'Triple Tracker',   badge_icon: '⚡' },
  { activity_id: null, badge_key: 'early_bird',      badge_name: 'Early Bird',       badge_icon: '🌅' },
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
  if (!existing || existing.is_earned) return existing ? normalizeBadge(existing) : null;

  await db.runAsync(
    `UPDATE badges SET is_earned = 1, unlocked_at = datetime('now') WHERE badge_key = ?`,
    [badgeKey]
  );
  return db.getFirstAsync<Badge>(
    `SELECT * FROM badges WHERE badge_key = ?`,
    [badgeKey]
  ).then((r) => (r ? normalizeBadge(r) : null));
}

function normalizeBadge(row: Badge): Badge {
  return {
    ...row,
    is_earned: row.is_earned === true || (row.is_earned as unknown as number) === 1,
  };
}
