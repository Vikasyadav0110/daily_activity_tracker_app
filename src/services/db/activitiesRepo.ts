import { getDatabase } from './database';
import { getTodayIST, isScheduledForDate } from '@utils/dateUtils';

export interface Activity {
  id: number;
  user_id: string | null;
  name: string;
  category: string;
  icon: string;
  frequency: string;
  target_duration: number | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface CreateActivityInput {
  name: string;
  category: string;
  icon: string;
  frequency: string;
  target_duration?: number;
  user_id?: string;
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO activities (name, category, icon, frequency, target_duration, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.category,
      input.icon,
      input.frequency,
      input.target_duration ?? null,
      input.user_id ?? null,
    ]
  );

  await db.runAsync(
    `INSERT INTO streaks (activity_id) VALUES (?)`,
    [result.lastInsertRowId]
  );

  const activity = await getActivityById(result.lastInsertRowId);
  if (!activity) throw new Error('Failed to create activity');
  return activity;
}

export async function getActivities(filters?: { archived?: boolean }): Promise<Activity[]> {
  const db = await getDatabase();
  const isArchived = filters?.archived ?? false;
  const rows = await db.getAllAsync<Activity>(
    `SELECT * FROM activities WHERE is_archived = ? ORDER BY created_at ASC`,
    [isArchived ? 1 : 0]
  );
  return rows.map(normalizeActivity);
}

export async function getActivitiesForDate(date: string): Promise<Activity[]> {
  const all = await getActivities({ archived: false });
  return all.filter((a) => isScheduledForDate(a.frequency, date));
}

export async function getActivityById(id: number): Promise<Activity | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Activity>(
    `SELECT * FROM activities WHERE id = ?`,
    [id]
  );
  return row ? normalizeActivity(row) : null;
}

export async function updateActivity(
  id: number,
  updates: Partial<Omit<Activity, 'id' | 'created_at'>>
): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(updates)
    .filter((k) => k !== 'id' && k !== 'created_at')
    .map((k) => `${k} = ?`);
  if (fields.length === 0) return;

  const values = Object.values(updates);
  await db.runAsync(
    `UPDATE activities SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    [...values, id]
  );
}

export async function archiveActivity(id: number): Promise<void> {
  await updateActivity(id, { is_archived: true } as Partial<Activity>);
}

export async function deleteActivity(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM activities WHERE id = ?`, [id]);
}

export async function getTodaysActivities(): Promise<Activity[]> {
  return getActivitiesForDate(getTodayIST());
}

function normalizeActivity(row: Activity): Activity {
  return {
    ...row,
    is_archived: row.is_archived === true || (row.is_archived as unknown as number) === 1,
  };
}
