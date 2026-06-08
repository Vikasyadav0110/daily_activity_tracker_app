import type { Streak } from '@services/db/streaksRepo';
import { daysBetween, getTodayIST } from './dateUtils';

export interface StreakUpdateResult {
  current_streak_days: number;
  longest_streak_days: number;
  streak_start_date: string | null;
  last_logged_date: string;
  forgiveness_used: boolean;
  streak_broken: boolean;
  forgiveness_applied: boolean;
}

export function calculateStreakUpdate(
  existing: Streak,
  logDate: string = getTodayIST()
): StreakUpdateResult {
  const last = existing.last_logged_date;

  // First ever log for this activity
  if (!last) {
    return {
      current_streak_days: 1,
      longest_streak_days: Math.max(1, existing.longest_streak_days),
      streak_start_date: logDate,
      last_logged_date: logDate,
      forgiveness_used: false,
      streak_broken: false,
      forgiveness_applied: false,
    };
  }

  // Already logged today — idempotent, no streak change
  if (last === logDate) {
    return {
      current_streak_days: existing.current_streak_days,
      longest_streak_days: existing.longest_streak_days,
      streak_start_date: existing.streak_start_date,
      last_logged_date: logDate,
      forgiveness_used: existing.forgiveness_used,
      streak_broken: false,
      forgiveness_applied: false,
    };
  }

  const gap = daysBetween(last, logDate);

  // Consecutive day (gap = 1) — extend streak
  if (gap === 1) {
    const newStreak = existing.current_streak_days + 1;
    const newLongest = Math.max(newStreak, existing.longest_streak_days);
    return {
      current_streak_days: newStreak,
      longest_streak_days: newLongest,
      streak_start_date: existing.streak_start_date ?? logDate,
      last_logged_date: logDate,
      forgiveness_used: false, // forgiveness resets on a clean consecutive day
      streak_broken: false,
      forgiveness_applied: false,
    };
  }

  // Missed exactly 1 day (gap = 2) — check 48h forgiveness
  if (gap === 2 && !existing.forgiveness_used && existing.current_streak_days > 0) {
    const newStreak = existing.current_streak_days + 1;
    const newLongest = Math.max(newStreak, existing.longest_streak_days);
    return {
      current_streak_days: newStreak,
      longest_streak_days: newLongest,
      streak_start_date: existing.streak_start_date ?? logDate,
      last_logged_date: logDate,
      forgiveness_used: true,
      streak_broken: false,
      forgiveness_applied: true,
    };
  }

  // Streak broken — reset and start fresh
  return {
    current_streak_days: 1,
    longest_streak_days: existing.longest_streak_days,
    streak_start_date: logDate,
    last_logged_date: logDate,
    forgiveness_used: false,
    streak_broken: true,
    forgiveness_applied: false,
  };
}

export function isStreakAtRisk(streak: Streak, today: string = getTodayIST()): boolean {
  if (!streak.last_logged_date || streak.current_streak_days === 0) return false;
  const gap = daysBetween(streak.last_logged_date, today);
  if (gap === 0) return false; // already logged today
  if (gap === 1) return true;  // haven't logged yet today, streak on the line
  if (gap === 2 && !streak.forgiveness_used) return true; // forgiveness available
  return false;
}

export function isStreakBroken(streak: Streak, today: string = getTodayIST()): boolean {
  if (!streak.last_logged_date || streak.current_streak_days === 0) return false;
  const gap = daysBetween(streak.last_logged_date, today);
  if (gap <= 1) return false;
  if (gap === 2 && !streak.forgiveness_used) return false;
  return true;
}

export function getStreakDaysForRange(
  logDates: string[],
  startDate: string,
  endDate: string
): Record<string, boolean> {
  const logSet = new Set(logDates);
  const result: Record<string, boolean> = {};
  let current = startDate;
  while (current <= endDate) {
    result[current] = logSet.has(current);
    const d = new Date(current);
    d.setDate(d.getDate() + 1);
    current = d.toISOString().split('T')[0];
  }
  return result;
}
