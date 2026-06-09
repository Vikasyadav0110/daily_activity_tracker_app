import { getDatabase } from '@services/db/database';
import { getTodayIST } from '@utils/dateUtils';

export interface XPResult {
  xpGained: number;
  totalXp: number;
  weekXp: number;
  level: number;
  leveledUp: boolean;
  breakdown: Array<{ reason: string; amount: number }>;
}

export interface XPState {
  totalXp: number;
  weekXp: number;
  level: number;
}

// XP amounts per event
const XP = {
  COMPLETE: 10,
  STREAK_7: 25,
  STREAK_30: 100,
  STREAK_100: 500,
  FULL_DAY_BONUS: 20,    // all activities done
  DURATION_MET: 5,       // actual ≥ target duration
} as const;

// Level thresholds
export const XP_LEVELS = [
  { level: 0, name: 'Beginner',  minXp: 0,    icon: '🌱' },
  { level: 1, name: 'Explorer',  minXp: 100,  icon: '🚀' },
  { level: 2, name: 'Achiever',  minXp: 500,  icon: '⚡' },
  { level: 3, name: 'Champion',  minXp: 2000, icon: '🏆' },
  { level: 4, name: 'Legend',    minXp: 5000, icon: '👑' },
] as const;

export function getLevelInfo(totalXp: number) {
  let current: typeof XP_LEVELS[number] = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (totalXp >= lvl.minXp) current = lvl;
  }
  const nextIdx = XP_LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = nextIdx < XP_LEVELS.length ? XP_LEVELS[nextIdx] : null;
  const progress = next
    ? (totalXp - current.minXp) / (next.minXp - current.minXp)
    : 1;
  return { current, next, progress: Math.min(1, progress) };
}

export async function getXPState(): Promise<XPState> {
  const db = await getDatabase();
  const today = getTodayIST();

  // Reset week_xp if it's a new ISO week
  const row = await db.getFirstAsync<{
    total_xp: number;
    week_xp: number;
    level: number;
    week_reset_date: string;
  }>('SELECT * FROM user_xp WHERE id = 1');

  if (!row) return { totalXp: 0, weekXp: 0, level: 0 };

  // Check if week has rolled over (simple: compare week number)
  const resetDate = new Date(row.week_reset_date + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const daysDiff = Math.floor((todayDate.getTime() - resetDate.getTime()) / 86400000);

  if (daysDiff >= 7) {
    await db.runAsync(
      `UPDATE user_xp SET week_xp = 0, week_reset_date = ? WHERE id = 1`,
      [today]
    );
    return { totalXp: row.total_xp, weekXp: 0, level: row.level };
  }

  return { totalXp: row.total_xp, weekXp: row.week_xp, level: row.level };
}

export async function awardXP(
  activityId: number,
  streakDays: number,
  durationMet: boolean,
  allActivitiesDoneToday: boolean
): Promise<XPResult> {
  const db = await getDatabase();
  const breakdown: Array<{ reason: string; amount: number }> = [];

  let xpGained = XP.COMPLETE;
  breakdown.push({ reason: 'activity_complete', amount: XP.COMPLETE });

  if (durationMet) {
    xpGained += XP.DURATION_MET;
    breakdown.push({ reason: 'duration_met', amount: XP.DURATION_MET });
  }

  if (streakDays === 7) {
    xpGained += XP.STREAK_7;
    breakdown.push({ reason: 'streak_7', amount: XP.STREAK_7 });
  } else if (streakDays === 30) {
    xpGained += XP.STREAK_30;
    breakdown.push({ reason: 'streak_30', amount: XP.STREAK_30 });
  } else if (streakDays === 100) {
    xpGained += XP.STREAK_100;
    breakdown.push({ reason: 'streak_100', amount: XP.STREAK_100 });
  }

  if (allActivitiesDoneToday) {
    xpGained += XP.FULL_DAY_BONUS;
    breakdown.push({ reason: 'full_day', amount: XP.FULL_DAY_BONUS });
  }

  // Log XP event
  await db.runAsync(
    `INSERT INTO xp_events (activity_id, event_type, xp_amount) VALUES (?, ?, ?)`,
    [activityId, 'activity_complete', xpGained]
  );

  // Update totals
  await db.runAsync(
    `UPDATE user_xp SET
       total_xp = total_xp + ?,
       week_xp = week_xp + ?,
       updated_at = datetime('now')
     WHERE id = 1`,
    [xpGained, xpGained]
  );

  const updated = await db.getFirstAsync<{ total_xp: number; week_xp: number; level: number }>(
    'SELECT total_xp, week_xp, level FROM user_xp WHERE id = 1'
  );

  const totalXp = updated?.total_xp ?? xpGained;
  const weekXp = updated?.week_xp ?? xpGained;
  const oldLevel = updated?.level ?? 0;
  const newLevel = getLevelInfo(totalXp).current.level;
  const leveledUp = newLevel > oldLevel;

  if (leveledUp) {
    await db.runAsync('UPDATE user_xp SET level = ? WHERE id = 1', [newLevel]);
  }

  return { xpGained, totalXp, weekXp, level: newLevel, leveledUp, breakdown };
}
