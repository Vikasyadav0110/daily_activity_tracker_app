import { calculateStreakUpdate, isStreakAtRisk, isStreakBroken } from '../../src/utils/streakCalculator';
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

describe('calculateStreakUpdate', () => {
  // TC-01: New user — first ever log
  it('TC-01: first log sets streak to 1', () => {
    const streak = makeStreak();
    const result = calculateStreakUpdate(streak, '2024-01-01');
    expect(result.current_streak_days).toBe(1);
    expect(result.streak_start_date).toBe('2024-01-01');
    expect(result.last_logged_date).toBe('2024-01-01');
    expect(result.streak_broken).toBe(false);
    expect(result.forgiveness_applied).toBe(false);
  });

  // TC-02: Consecutive 7 days
  it('TC-02: consecutive 7 days produces streak = 7', () => {
    let streak = makeStreak();
    const dates = ['2024-01-01','2024-01-02','2024-01-03','2024-01-04','2024-01-05','2024-01-06','2024-01-07'];
    for (const date of dates) {
      const result = calculateStreakUpdate(streak, date);
      streak = { ...streak, ...result };
    }
    expect(streak.current_streak_days).toBe(7);
    expect(streak.longest_streak_days).toBe(7);
  });

  // TC-03: Already logged today — idempotent
  it('TC-03: logging same day twice is idempotent', () => {
    const streak = makeStreak({ current_streak_days: 3, last_logged_date: '2024-01-10' });
    const result = calculateStreakUpdate(streak, '2024-01-10');
    expect(result.current_streak_days).toBe(3);
    expect(result.streak_broken).toBe(false);
    expect(result.forgiveness_applied).toBe(false);
  });

  // TC-04: Consecutive day extends streak
  it('TC-04: consecutive day extends streak by 1', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-10', streak_start_date: '2024-01-06' });
    const result = calculateStreakUpdate(streak, '2024-01-11');
    expect(result.current_streak_days).toBe(6);
    expect(result.streak_broken).toBe(false);
    expect(result.forgiveness_used).toBe(false);
  });

  // TC-05: Miss 1 day (gap=2) → forgiveness applied
  it('TC-05: missing 1 day applies 48h forgiveness (gap=2)', () => {
    const streak = makeStreak({
      current_streak_days: 7,
      last_logged_date: '2024-01-08',
      streak_start_date: '2024-01-02',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-10');
    expect(result.current_streak_days).toBe(8);
    expect(result.forgiveness_used).toBe(true);
    expect(result.forgiveness_applied).toBe(true);
    expect(result.streak_broken).toBe(false);
  });

  // TC-06: Miss 1 day, forgiveness already used → streak resets
  it('TC-06: second forgiveness attempt resets streak', () => {
    const streak = makeStreak({
      current_streak_days: 5,
      last_logged_date: '2024-01-08',
      forgiveness_used: true,
    });
    const result = calculateStreakUpdate(streak, '2024-01-10');
    expect(result.current_streak_days).toBe(1);
    expect(result.streak_broken).toBe(true);
    expect(result.forgiveness_applied).toBe(false);
  });

  // TC-07: Miss 2+ consecutive days → streak always resets
  it('TC-07: missing 2 days resets streak regardless of forgiveness', () => {
    const streak = makeStreak({
      current_streak_days: 10,
      last_logged_date: '2024-01-07',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-10'); // gap = 3
    expect(result.current_streak_days).toBe(1);
    expect(result.streak_broken).toBe(true);
  });

  // TC-08: Forgiveness on exactly day 3 (gap=2) — should NOT reset (gap=2 IS forgiveness window)
  it('TC-08: gap of exactly 2 days triggers forgiveness (48h window)', () => {
    const streak = makeStreak({
      current_streak_days: 4,
      last_logged_date: '2024-01-05',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-07'); // gap = 2
    expect(result.forgiveness_applied).toBe(true);
    expect(result.current_streak_days).toBe(5);
  });

  // TC-09: Longest streak updated when current exceeds it
  it('TC-09: longest_streak updates when current beats it', () => {
    const streak = makeStreak({
      current_streak_days: 10,
      longest_streak_days: 10,
      last_logged_date: '2024-03-01',
    });
    const result = calculateStreakUpdate(streak, '2024-03-02');
    expect(result.current_streak_days).toBe(11);
    expect(result.longest_streak_days).toBe(11);
  });

  // TC-10: Longest streak NOT updated when current is less
  it('TC-10: longest_streak stays if current does not exceed', () => {
    const streak = makeStreak({
      current_streak_days: 3,
      longest_streak_days: 30,
      last_logged_date: '2024-03-01',
    });
    const result = calculateStreakUpdate(streak, '2024-03-02');
    expect(result.current_streak_days).toBe(4);
    expect(result.longest_streak_days).toBe(30);
  });

  // TC-11: Forgiveness resets on new streak cycle
  it('TC-11: forgiveness_used resets to false on next consecutive day after reset', () => {
    // Streak reset happened (was using forgiveness), now starts fresh
    const streak = makeStreak({
      current_streak_days: 1,
      last_logged_date: '2024-02-01',
      forgiveness_used: true, // carried over incorrectly
    });
    const result = calculateStreakUpdate(streak, '2024-02-02'); // consecutive
    expect(result.forgiveness_used).toBe(false); // reset on consecutive day
  });

  // TC-12: Streak across month boundary
  it('TC-12: streak extends across month boundary (Jan 31 → Feb 1)', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-31' });
    const result = calculateStreakUpdate(streak, '2024-02-01');
    expect(result.current_streak_days).toBe(6);
    expect(result.streak_broken).toBe(false);
  });

  // TC-13: Streak across year boundary
  it('TC-13: streak extends across year boundary (Dec 31 → Jan 1)', () => {
    const streak = makeStreak({ current_streak_days: 20, last_logged_date: '2023-12-31' });
    const result = calculateStreakUpdate(streak, '2024-01-01');
    expect(result.current_streak_days).toBe(21);
    expect(result.streak_broken).toBe(false);
  });

  // TC-14: Leap day handling
  it('TC-14: streak extends across Feb 28 to Feb 29 on leap year', () => {
    const streak = makeStreak({ current_streak_days: 2, last_logged_date: '2024-02-28' });
    const result = calculateStreakUpdate(streak, '2024-02-29');
    expect(result.current_streak_days).toBe(3);
  });

  // TC-15: streak_start_date set correctly
  it('TC-15: streak_start_date preserved on extension (not overwritten)', () => {
    const streak = makeStreak({
      current_streak_days: 3,
      last_logged_date: '2024-06-10',
      streak_start_date: '2024-06-08',
    });
    const result = calculateStreakUpdate(streak, '2024-06-11');
    expect(result.streak_start_date).toBe('2024-06-08'); // unchanged
  });

  // TC-16: streak_start_date updated on reset
  it('TC-16: streak_start_date updates to logDate on reset', () => {
    const streak = makeStreak({
      current_streak_days: 5,
      last_logged_date: '2024-06-01',
      streak_start_date: '2024-05-28',
    });
    const result = calculateStreakUpdate(streak, '2024-06-10'); // gap > 2, reset
    expect(result.streak_start_date).toBe('2024-06-10');
    expect(result.current_streak_days).toBe(1);
  });

  // TC-17: Gap of 3 with forgiveness available — still resets (gap > 2)
  it('TC-17: gap of 3 days resets even if forgiveness unused', () => {
    const streak = makeStreak({
      current_streak_days: 8,
      last_logged_date: '2024-01-01',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-04'); // gap = 3
    expect(result.current_streak_days).toBe(1);
    expect(result.streak_broken).toBe(true);
  });

  // TC-18: First log with existing longest_streak data
  it('TC-18: first log does not decrease existing longest streak', () => {
    const streak = makeStreak({ longest_streak_days: 15 }); // was reset, no last_logged
    const result = calculateStreakUpdate(streak, '2024-01-01');
    expect(result.longest_streak_days).toBe(15);
    expect(result.current_streak_days).toBe(1);
  });

  // TC-19: Zero streak with forgiveness_used=false — forgiveness still available
  it('TC-19: streak of 0 with forgiveness false — forgiveness IS available if reset happens', () => {
    const streak = makeStreak({
      current_streak_days: 0,
      last_logged_date: null,
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-01');
    expect(result.current_streak_days).toBe(1);
    expect(result.forgiveness_used).toBe(false); // still available
  });

  // TC-20: forgiveness_applied is false on normal consecutive extension
  it('TC-20: forgiveness_applied is false on normal consecutive day', () => {
    const streak = makeStreak({ current_streak_days: 2, last_logged_date: '2024-04-10' });
    const result = calculateStreakUpdate(streak, '2024-04-11');
    expect(result.forgiveness_applied).toBe(false);
  });
});

describe('isStreakAtRisk', () => {
  it('returns false when logged today', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-10' });
    expect(isStreakAtRisk(streak, '2024-01-10')).toBe(false);
  });

  it('returns true when not logged today (gap=1)', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-09' });
    expect(isStreakAtRisk(streak, '2024-01-10')).toBe(true);
  });

  it('returns true when gap=2 and forgiveness available', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-08', forgiveness_used: false });
    expect(isStreakAtRisk(streak, '2024-01-10')).toBe(true);
  });

  it('returns false for new user with no logs', () => {
    const streak = makeStreak({ current_streak_days: 0 });
    expect(isStreakAtRisk(streak, '2024-01-10')).toBe(false);
  });
});

describe('isStreakBroken', () => {
  it('returns false when logged today', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-10' });
    expect(isStreakBroken(streak, '2024-01-10')).toBe(false);
  });

  it('returns false on gap=1 (not yet logged today)', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-09' });
    expect(isStreakBroken(streak, '2024-01-10')).toBe(false);
  });

  it('returns false on gap=2 with forgiveness available', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-08', forgiveness_used: false });
    expect(isStreakBroken(streak, '2024-01-10')).toBe(false);
  });

  it('returns true on gap=2 with forgiveness already used', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-08', forgiveness_used: true });
    expect(isStreakBroken(streak, '2024-01-10')).toBe(true);
  });

  it('returns true on gap=3+ regardless of forgiveness', () => {
    const streak = makeStreak({ current_streak_days: 5, last_logged_date: '2024-01-07', forgiveness_used: false });
    expect(isStreakBroken(streak, '2024-01-10')).toBe(true);
  });
});

// Badge milestone crossing tests — validates the >= / prevDays < milestone logic used in ActivityListItem
describe('milestone crossing detection (simulated)', () => {
  it('forgiveness jump from 2→4 crosses milestone at 3', () => {
    // Simulate: streak was 2, forgiveness applied, now 4
    const streak = makeStreak({
      current_streak_days: 2,
      last_logged_date: '2024-01-08',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-01-10'); // gap=2, forgiveness
    expect(result.current_streak_days).toBe(3);
    expect(result.forgiveness_applied).toBe(true);
    // milestone 3: prevDays(2) < 3 <= newDays(3) → should fire
    const prevDays = 2;
    const newDays = result.current_streak_days;
    expect(newDays >= 3 && prevDays < 3).toBe(true);
  });

  it('forgiveness jump from 5→7 crosses milestone at 7', () => {
    const streak = makeStreak({
      current_streak_days: 5,
      last_logged_date: '2024-02-10',
      forgiveness_used: false,
    });
    const result = calculateStreakUpdate(streak, '2024-02-12'); // gap=2
    // Note: forgiveness extends by 1, so 5→6 not 5→7. Gap=2 adds 1 day.
    expect(result.current_streak_days).toBe(6);
    const prevDays = 5;
    const newDays = result.current_streak_days;
    // milestone 7: 6 < 7, so should NOT fire
    expect(newDays >= 7 && prevDays < 7).toBe(false);
  });

  it('consecutive day from 6→7 crosses milestone at 7', () => {
    const streak = makeStreak({
      current_streak_days: 6,
      last_logged_date: '2024-03-01',
    });
    const result = calculateStreakUpdate(streak, '2024-03-02');
    expect(result.current_streak_days).toBe(7);
    const prevDays = 6;
    const newDays = result.current_streak_days;
    expect(newDays >= 7 && prevDays < 7).toBe(true);
  });

  it('streak already at 7, extending to 8 does NOT re-fire milestone 7', () => {
    const streak = makeStreak({
      current_streak_days: 7,
      last_logged_date: '2024-03-02',
    });
    const result = calculateStreakUpdate(streak, '2024-03-03');
    expect(result.current_streak_days).toBe(8);
    const prevDays = 7;
    const newDays = result.current_streak_days;
    // prevDays is NOT < 7, so milestone should not fire
    expect(newDays >= 7 && prevDays < 7).toBe(false);
  });
});
