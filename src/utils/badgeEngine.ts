import type { Streak } from '@services/db/streaksRepo';

export interface BadgeTrigger {
  key: string;
  condition: (streak: Streak, totalStudyHours?: number, activitiesCount?: number) => boolean;
}

export const BADGE_TRIGGERS: BadgeTrigger[] = [
  {
    key: 'first_log',
    condition: (streak) => streak.current_streak_days >= 1,
  },
  {
    key: 'streak_7',
    condition: (streak) => streak.current_streak_days >= 7,
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
    key: 'studied_100h',
    condition: (_streak, totalStudyHours = 0) => totalStudyHours >= 100,
  },
  {
    key: 'activities_3',
    condition: (_streak, _hours, activitiesCount = 0) => activitiesCount >= 3,
  },
];

export function evaluateBadges(
  streak: Streak,
  totalStudyHours = 0,
  activitiesCount = 0
): string[] {
  return BADGE_TRIGGERS
    .filter((t) => t.condition(streak, totalStudyHours, activitiesCount))
    .map((t) => t.key);
}
