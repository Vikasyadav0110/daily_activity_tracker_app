import type { Streak } from '@services/db/streaksRepo';

export interface BadgeTrigger {
  key: string;
  condition: (streak: Streak, totalStudyHours?: number, activitiesCount?: number) => boolean;
}

// Keys must match DEFAULT_BADGES in badgesRepo.ts exactly
export const BADGE_TRIGGERS: BadgeTrigger[] = [
  {
    key: 'first_checkoff',
    condition: (streak) => streak.current_streak_days >= 1,
  },
  {
    key: 'streak_3',
    condition: (streak) => streak.current_streak_days >= 3,
  },
  {
    key: 'streak_7',
    condition: (streak) => streak.current_streak_days >= 7,
  },
  {
    key: 'streak_14',
    condition: (streak) => streak.current_streak_days >= 14,
  },
  {
    key: 'streak_30',
    condition: (streak) => streak.current_streak_days >= 30,
  },
  {
    key: 'streak_100',
    condition: (streak) => streak.current_streak_days >= 100,
  },
  {
    key: 'studied_10h',
    condition: (_streak, totalStudyHours = 0) => totalStudyHours >= 10,
  },
  {
    key: 'studied_50h',
    condition: (_streak, totalStudyHours = 0) => totalStudyHours >= 50,
  },
  {
    key: 'studied_100h',
    condition: (_streak, totalStudyHours = 0) => totalStudyHours >= 100,
  },
  {
    key: 'activities_5',
    condition: (_streak, _hours, activitiesCount = 0) => activitiesCount >= 5,
  },
];

/**
 * Returns badge keys whose conditions are met.
 * Callers are responsible for filtering out already-earned badges before unlocking.
 */
export function evaluateBadges(
  streak: Streak,
  totalStudyHours = 0,
  activitiesCount = 0
): string[] {
  return BADGE_TRIGGERS
    .filter((t) => t.condition(streak, totalStudyHours, activitiesCount))
    .map((t) => t.key);
}
