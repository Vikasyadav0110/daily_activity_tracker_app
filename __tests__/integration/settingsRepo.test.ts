import * as MockedSQLite from 'expo-sqlite';
import { getSettings, updateSettings } from '../../src/services/db/settingsRepo';
import { initDatabase, resetDatabaseSingleton } from '../../src/services/db/database';

jest.mock('expo-sqlite');
jest.mock('../../src/services/db/badgesRepo', () => ({
  seedDefaultBadges: jest.fn(() => Promise.resolve()),
}));
jest.mock('@supabase/supabase-js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __mockDb = (MockedSQLite as any).__mockDb;

beforeEach(async () => {
  __mockDb.reset();
  resetDatabaseSingleton();
  await initDatabase();
});

describe('getSettings', () => {
  it('TC-S01: returns defaults on first call', async () => {
    const s = await getSettings();
    expect(s.language).toBe('en');
    expect(s.theme).toBe('light');
    expect(s.region_code).toBe('IN');
    expect(s.notification_enabled).toBe(true);
    expect(s.onboarding_complete).toBe(false);
  });

  it('TC-S02: returns same row on repeated calls', async () => {
    const a = await getSettings();
    const b = await getSettings();
    expect(a.id).toBe(b.id);
  });
});

describe('updateSettings', () => {
  it('TC-S03: updates language', async () => {
    await updateSettings({ language: 'hi' });
    const s = await getSettings();
    expect(s.language).toBe('hi');
  });

  it('TC-S04: updates theme to dark', async () => {
    await updateSettings({ theme: 'dark' });
    const s = await getSettings();
    expect(s.theme).toBe('dark');
  });

  it('TC-S05: updates region_code', async () => {
    await updateSettings({ region_code: 'US' });
    const s = await getSettings();
    expect(s.region_code).toBe('US');
  });

  it('TC-S06: updates notification_enabled', async () => {
    await updateSettings({ notification_enabled: true });
    const s = await getSettings();
    expect(s.notification_enabled).toBe(true);
  });

  it('TC-S07: updates onboarding_complete', async () => {
    await updateSettings({ onboarding_complete: true });
    const s = await getSettings();
    expect(s.onboarding_complete).toBe(true);
  });

  it('TC-S08: updates multiple fields at once', async () => {
    await updateSettings({ language: 'ta', theme: 'dark', region_code: 'SG' });
    const s = await getSettings();
    expect(s.language).toBe('ta');
    expect(s.theme).toBe('dark');
    expect(s.region_code).toBe('SG');
  });

  it('TC-S09: no-op when passed empty object', async () => {
    await updateSettings({});
    const s = await getSettings();
    expect(s.language).toBe('en');
  });

  it('TC-S10: persists reminder_times as JSON', async () => {
    const times = [{ activity_id: 1, time: '07:30' }, { activity_id: 2, time: '20:00' }];
    await updateSettings({ reminder_times: times });
    const s = await getSettings();
    expect(s.reminder_times).toEqual(times);
  });
});
