import { getDatabase } from './database';

export interface Streak {
  id: number;
  activity_id: number;
  current_streak_days: number;
  longest_streak_days: number;
  streak_start_date: string | null;
  last_logged_date: string | null;
  forgiveness_used: boolean;
}

export async function getStreak(activityId: number): Promise<Streak | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Streak>(
    `SELECT * FROM streaks WHERE activity_id = ?`,
    [activityId]
  );
  if (!row) return null;
  return normalizeStreak(row);
}

export async function upsertStreak(
  activityId: number,
  updates: Partial<Omit<Streak, 'id' | 'activity_id'>>
): Promise<void> {
  const db = await getDatabase();

  const existing = await getStreak(activityId);
  if (!existing) {
    await db.runAsync(
      `INSERT INTO streaks (activity_id, current_streak_days, longest_streak_days,
         streak_start_date, last_logged_date, forgiveness_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        activityId,
        updates.current_streak_days ?? 0,
        updates.longest_streak_days ?? 0,
        updates.streak_start_date ?? null,
        updates.last_logged_date ?? null,
        updates.forgiveness_used ? 1 : 0,
      ]
    );
    return;
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.current_streak_days !== undefined) {
    fields.push('current_streak_days = ?');
    values.push(updates.current_streak_days);
  }
  if (updates.longest_streak_days !== undefined) {
    fields.push('longest_streak_days = ?');
    values.push(updates.longest_streak_days);
  }
  if (updates.streak_start_date !== undefined) {
    fields.push('streak_start_date = ?');
    values.push(updates.streak_start_date);
  }
  if (updates.last_logged_date !== undefined) {
    fields.push('last_logged_date = ?');
    values.push(updates.last_logged_date);
  }
  if (updates.forgiveness_used !== undefined) {
    fields.push('forgiveness_used = ?');
    values.push(updates.forgiveness_used ? 1 : 0);
  }

  if (fields.length === 0) return;
  values.push(activityId);

  await db.runAsync(
    `UPDATE streaks SET ${fields.join(', ')} WHERE activity_id = ?`,
    values
  );
}

export async function resetStreak(activityId: number): Promise<void> {
  await upsertStreak(activityId, {
    current_streak_days: 0,
    streak_start_date: null,
    last_logged_date: null,
    forgiveness_used: false,
  });
}

export async function getAllStreaks(): Promise<Streak[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Streak>(`SELECT * FROM streaks`);
  return rows.map(normalizeStreak);
}

function normalizeStreak(row: Streak): Streak {
  return {
    ...row,
    forgiveness_used:
      row.forgiveness_used === true || (row.forgiveness_used as unknown as number) === 1,
  };
}
