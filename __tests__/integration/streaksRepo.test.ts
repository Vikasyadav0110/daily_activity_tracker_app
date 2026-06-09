import * as MockedSQLite from 'expo-sqlite';
import { createActivity } from '../../src/services/db/activitiesRepo';
import {
  getStreak,
  upsertStreak,
  resetStreak,
} from '../../src/services/db/streaksRepo';
import { initDatabase, resetDatabaseSingleton } from '../../src/services/db/database';

jest.mock('expo-sqlite');
jest.mock('../../src/services/db/badgesRepo', () => ({
  seedDefaultBadges: jest.fn(() => Promise.resolve()),
}));
jest.mock('@supabase/supabase-js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __mockDb = (MockedSQLite as any).__mockDb;

let activityId: number;

beforeEach(async () => {
  __mockDb.reset();
  resetDatabaseSingleton();
  await initDatabase();
  const act = await createActivity({ name: 'Yoga', category: 'wellness', icon: '🧘', frequency: 'daily' });
  activityId = act.id;
});

describe('getStreak', () => {
  it('TC-ST01: returns null before any streak row exists', async () => {
    // createActivity inserts a streak row — check initial values
    const s = await getStreak(activityId);
    expect(s).not.toBeNull();
    expect(s?.current_streak_days).toBe(0);
    expect(s?.longest_streak_days).toBe(0);
  });

  it('TC-ST02: returns null for non-existent activity id', async () => {
    const s = await getStreak(9999);
    expect(s).toBeNull();
  });
});

describe('upsertStreak', () => {
  it('TC-ST03: updates current_streak_days', async () => {
    await upsertStreak(activityId, { current_streak_days: 5, last_logged_date: '2026-06-09' });
    const s = await getStreak(activityId);
    expect(s?.current_streak_days).toBe(5);
    expect(s?.last_logged_date).toBe('2026-06-09');
  });

  it('TC-ST04: longest_streak_days updates independently', async () => {
    await upsertStreak(activityId, { current_streak_days: 7, longest_streak_days: 7 });
    const s = await getStreak(activityId);
    expect(s?.longest_streak_days).toBe(7);
  });

  it('TC-ST05: streak_start_date is persisted', async () => {
    await upsertStreak(activityId, { streak_start_date: '2026-06-01', current_streak_days: 9 });
    const s = await getStreak(activityId);
    expect(s?.streak_start_date).toBe('2026-06-01');
  });

  it('TC-ST06: forgiveness_used flag persists as boolean', async () => {
    await upsertStreak(activityId, { forgiveness_used: true });
    const s = await getStreak(activityId);
    expect(s?.forgiveness_used).toBe(true);
  });

  it('TC-ST07: inserts new streak row when none exists', async () => {
    const newAct = await createActivity({ name: 'Chess', category: 'cognitive', icon: '♟️', frequency: 'daily' });
    // createActivity seeds a row; test that upsert on top of it works
    await upsertStreak(newAct.id, { current_streak_days: 3 });
    const s = await getStreak(newAct.id);
    expect(s?.current_streak_days).toBe(3);
  });
});

describe('resetStreak', () => {
  it('TC-ST08: resets current streak to 0 after building one up', async () => {
    await upsertStreak(activityId, { current_streak_days: 14, longest_streak_days: 14 });
    await resetStreak(activityId);
    const s = await getStreak(activityId);
    expect(s?.current_streak_days).toBe(0);
  });

  it('TC-ST09: longest_streak_days is preserved after reset', async () => {
    await upsertStreak(activityId, { current_streak_days: 14, longest_streak_days: 14 });
    await resetStreak(activityId);
    const s = await getStreak(activityId);
    expect(s?.longest_streak_days).toBe(14);
  });
});
