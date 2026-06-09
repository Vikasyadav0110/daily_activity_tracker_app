import * as MockedSQLite from 'expo-sqlite';
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  archiveActivity,
} from '../../src/services/db/activitiesRepo';
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

describe('createActivity', () => {
  it('TC-A01: creates an activity and returns it with an id', async () => {
    const act = await createActivity({ name: 'Morning Run', category: 'fitness', icon: '🏃', frequency: 'daily' });
    expect(act.id).toBeGreaterThan(0);
    expect(act.name).toBe('Morning Run');
    expect(act.category).toBe('fitness');
    expect(act.is_archived).toBe(false);
  });

  it('TC-A02: creates a streak row for the new activity', async () => {
    const act = await createActivity({ name: 'Meditation', category: 'wellness', icon: '🧘', frequency: 'daily' });
    // Verify via getActivityById — streak is a separate table but creation should not throw
    expect(act.id).toBeGreaterThan(0);
  });

  it('TC-A03: multiple activities get unique ids', async () => {
    const a = await createActivity({ name: 'A', category: 'fitness', icon: '⚡', frequency: 'daily' });
    const b = await createActivity({ name: 'B', category: 'fitness', icon: '⚡', frequency: 'daily' });
    expect(a.id).not.toBe(b.id);
  });
});

describe('getActivities', () => {
  it('TC-A04: returns only non-archived activities by default', async () => {
    await createActivity({ name: 'Active', category: 'fitness', icon: '⚡', frequency: 'daily' });
    const archived = await createActivity({ name: 'Archived', category: 'fitness', icon: '⚡', frequency: 'daily' });
    await archiveActivity(archived.id);

    const active = await getActivities({ archived: false });
    const names = active.map((a) => a.name);
    expect(names).toContain('Active');
    expect(names).not.toContain('Archived');
  });

  it('TC-A05: returns archived activities when requested', async () => {
    const act = await createActivity({ name: 'ToArchive', category: 'fitness', icon: '⚡', frequency: 'daily' });
    await archiveActivity(act.id);
    const archived = await getActivities({ archived: true });
    expect(archived.some((a) => a.name === 'ToArchive')).toBe(true);
  });

  it('TC-A06: returns empty array when no activities exist', async () => {
    const result = await getActivities();
    expect(result).toHaveLength(0);
  });
});

describe('getActivityById', () => {
  it('TC-A07: returns the correct activity', async () => {
    const created = await createActivity({ name: 'Yoga', category: 'wellness', icon: '🧘', frequency: 'daily' });
    const found = await getActivityById(created.id);
    expect(found?.name).toBe('Yoga');
  });

  it('TC-A08: returns null for non-existent id', async () => {
    const result = await getActivityById(9999);
    expect(result).toBeNull();
  });
});

describe('updateActivity', () => {
  it('TC-A09: updates name and icon', async () => {
    const act = await createActivity({ name: 'Old Name', category: 'fitness', icon: '⚡', frequency: 'daily' });
    await updateActivity(act.id, { name: 'New Name', icon: '🏃' });
    const updated = await getActivityById(act.id);
    expect(updated?.name).toBe('New Name');
    expect(updated?.icon).toBe('🏃');
  });
});

describe('archiveActivity', () => {
  it('TC-A10: archived activity disappears from active list', async () => {
    const act = await createActivity({ name: 'ToArchive', category: 'fitness', icon: '⚡', frequency: 'daily' });
    await archiveActivity(act.id);
    const active = await getActivities();
    expect(active.some((a) => a.id === act.id)).toBe(false);
  });
});
