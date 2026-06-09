import { evaluateBadges, BADGE_TRIGGERS } from '../../src/utils/badgeEngine';
import type { Streak } from '../../src/services/db/streaksRepo';

function makeStreak(overrides: Partial<Streak> = {}): Streak {
  return {
    id: 1,
    activity_id: 1,
    current_streak_days: 0,
    longest_streak_days: 0,
    streak_start_date: null,
    last_logged_date: null,
    forgiveness_used: false,
    ...overrides,
  };
}

describe('BADGE_TRIGGERS key alignment', () => {
  const DB_BADGE_KEYS = [
    'first_checkoff', 'streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100',
    'studied_10h', 'studied_50h', 'studied_100h',
    'mock_test_first', 'mock_test_ace', 'syllabus_50', 'syllabus_100', 'activities_5',
  ];

  it('all engine trigger keys exist in the DB badge catalog', () => {
    for (const trigger of BADGE_TRIGGERS) {
      expect(DB_BADGE_KEYS).toContain(trigger.key);
    }
  });

  it('no duplicate keys in BADGE_TRIGGERS', () => {
    const keys = BADGE_TRIGGERS.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('evaluateBadges — streak milestones', () => {
  it('returns first_checkoff at streak=1', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 1 }));
    expect(result).toContain('first_checkoff');
  });

  it('returns streak_3 at streak=3', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 3 }));
    expect(result).toContain('streak_3');
    expect(result).toContain('first_checkoff'); // lower milestones also true
  });

  it('returns streak_7 at streak=7', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 7 }));
    expect(result).toContain('streak_7');
  });

  it('returns streak_14 at streak=14', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 14 }));
    expect(result).toContain('streak_14');
  });

  it('does NOT return streak_7 at streak=6', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 6 }));
    expect(result).not.toContain('streak_7');
  });

  it('returns all streak badges at streak=100', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 100 }));
    expect(result).toContain('streak_100');
    expect(result).toContain('streak_30');
    expect(result).toContain('streak_7');
  });
});

describe('evaluateBadges — study hours', () => {
  it('returns studied_10h at 10 hours', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 1 }), 10);
    expect(result).toContain('studied_10h');
  });

  it('does NOT return studied_10h at 9 hours', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 1 }), 9);
    expect(result).not.toContain('studied_10h');
  });

  it('returns studied_50h and studied_10h at 50 hours', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 0 }), 50);
    expect(result).toContain('studied_50h');
    expect(result).toContain('studied_10h');
  });

  it('returns all study badges at 100 hours', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 0 }), 100);
    expect(result).toContain('studied_100h');
    expect(result).toContain('studied_50h');
    expect(result).toContain('studied_10h');
  });
});

describe('evaluateBadges — activity count', () => {
  it('returns activities_5 at count=5', () => {
    const result = evaluateBadges(makeStreak(), 0, 5);
    expect(result).toContain('activities_5');
  });

  it('does NOT return activities_5 at count=4', () => {
    const result = evaluateBadges(makeStreak(), 0, 4);
    expect(result).not.toContain('activities_5');
  });

  it('returns activities_5 at count=10 (above threshold)', () => {
    const result = evaluateBadges(makeStreak(), 0, 10);
    expect(result).toContain('activities_5');
  });
});

describe('evaluateBadges — empty state', () => {
  it('returns empty array for zero streak and no hours', () => {
    const result = evaluateBadges(makeStreak({ current_streak_days: 0 }), 0, 0);
    expect(result).toEqual([]);
  });
});
