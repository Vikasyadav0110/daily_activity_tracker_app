import * as MockedSQLite from 'expo-sqlite';
import { createActivity } from '../../src/services/db/activitiesRepo';
import {
  logActivity,
  getLogForDate,
  getLogsForDate,
  deleteLog,
  isLoggedToday,
  getLogsForRange,
} from '../../src/services/db/logsRepo';
import { initDatabase, resetDatabaseSingleton } from '../../src/services/db/database';

jest.mock('expo-sqlite');
jest.mock('../../src/services/db/badgesRepo', () => ({
  seedDefaultBadges: jest.fn(() => Promise.resolve()),
}));
jest.mock('@supabase/supabase-js');
jest.mock('../../src/utils/dateUtils', () => ({
  getTodayIST: jest.fn(() => '2026-06-09'),
  isScheduledForDate: jest.fn(() => true),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __mockDb = (MockedSQLite as any).__mockDb;

let activityId: number;

beforeEach(async () => {
  __mockDb.reset();
  resetDatabaseSingleton();
  await initDatabase();
  const act = await createActivity({ name: 'Running', category: 'fitness', icon: '🏃', frequency: 'daily' });
  activityId = act.id;
});

describe('logActivity', () => {
  it('TC-L01: logs an activity and returns the log', async () => {
    const log = await logActivity(activityId, '2026-06-09');
    expect(log.activity_id).toBe(activityId);
    expect(log.log_date).toBe('2026-06-09');
    expect(log.status).toBe('completed');
  });

  it('TC-L02: accepts custom status "skipped"', async () => {
    const log = await logActivity(activityId, '2026-06-09', { status: 'skipped' });
    expect(log.status).toBe('skipped');
  });

  it('TC-L03: accepts duration_minutes and notes', async () => {
    const log = await logActivity(activityId, '2026-06-09', { duration_minutes: 30, notes: 'Easy run' });
    expect(log.duration_minutes).toBe(30);
    expect(log.notes).toBe('Easy run');
  });

  it('TC-L04: re-logging same date replaces previous log (upsert)', async () => {
    await logActivity(activityId, '2026-06-09', { duration_minutes: 20 });
    await logActivity(activityId, '2026-06-09', { duration_minutes: 45 });
    const logs = await getLogsForDate('2026-06-09');
    const actLogs = logs.filter((l) => l.activity_id === activityId);
    expect(actLogs).toHaveLength(1);
  });
});

describe('getLogForDate', () => {
  it('TC-L05: returns null when no log exists', async () => {
    const result = await getLogForDate(activityId, '2026-01-01');
    expect(result).toBeNull();
  });

  it('TC-L06: returns the log after it is created', async () => {
    await logActivity(activityId, '2026-06-09');
    const log = await getLogForDate(activityId, '2026-06-09');
    expect(log).not.toBeNull();
    expect(log?.activity_id).toBe(activityId);
  });
});

describe('getLogsForDate', () => {
  it('TC-L07: returns all logs for a date', async () => {
    const act2 = await createActivity({ name: 'Reading', category: 'productivity', icon: '📚', frequency: 'daily' });
    await logActivity(activityId, '2026-06-09');
    await logActivity(act2.id, '2026-06-09');
    const logs = await getLogsForDate('2026-06-09');
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('getLogsForRange', () => {
  it('TC-L08: returns logs within a date range', async () => {
    await logActivity(activityId, '2026-06-07');
    await logActivity(activityId, '2026-06-08');
    await logActivity(activityId, '2026-06-09');
    const logs = await getLogsForRange('2026-06-07', '2026-06-08');
    expect(logs.every((l) => l.log_date <= '2026-06-08')).toBe(true);
  });
});

describe('deleteLog', () => {
  it('TC-L09: deletes a log so it no longer appears', async () => {
    await logActivity(activityId, '2026-06-09');
    await deleteLog(activityId, '2026-06-09');
    const log = await getLogForDate(activityId, '2026-06-09');
    expect(log).toBeNull();
  });
});

describe('isLoggedToday', () => {
  it('TC-L10: returns false before logging', async () => {
    const result = await isLoggedToday(activityId);
    expect(result).toBe(false);
  });

  it('TC-L11: returns true after logging today', async () => {
    await logActivity(activityId, '2026-06-09');
    const result = await isLoggedToday(activityId);
    expect(result).toBe(true);
  });

  it('TC-L12: returns false when status is skipped', async () => {
    await logActivity(activityId, '2026-06-09', { status: 'skipped' });
    const result = await isLoggedToday(activityId);
    expect(result).toBe(false);
  });
});
