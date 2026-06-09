import { getDatabase } from './database';

export interface Fast {
  id: number;
  vrat_name: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  mood_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface MantraLog {
  id: number;
  mantra_name: string;
  count: number;
  duration_minutes: number | null;
  date: string;
  created_at: string;
}

// ── Fasts ─────────────────────────────────────────────────────────────────────

export async function saveFast(
  vratName: string,
  startDate: string,
  endDate: string,
  startTime?: string | null,
  endTime?: string | null,
  status: Fast['status'] = 'planned',
  moodRating?: number | null,
  notes?: string | null
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO fasts (vrat_name, start_date, end_date, start_time, end_time, status, mood_rating, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [vratName, startDate, endDate, startTime ?? null, endTime ?? null, status, moodRating ?? null, notes ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateFastStatus(
  id: number,
  status: Fast['status'],
  moodRating?: number | null,
  endTime?: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE fasts SET status = ?, mood_rating = COALESCE(?, mood_rating), end_time = COALESCE(?, end_time) WHERE id = ?`,
    [status, moodRating ?? null, endTime ?? null, id]
  );
}

export async function getFastHistory(limit = 30): Promise<Fast[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Fast>(
    `SELECT * FROM fasts ORDER BY start_date DESC LIMIT ?`,
    [limit]
  );
  return rows ?? [];
}

export async function getFastStreak(vratName: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ start_date: string }>(
    `SELECT start_date FROM fasts WHERE vrat_name = ? AND status = 'completed' ORDER BY start_date DESC`,
    [vratName]
  );
  if (!rows?.length) return 0;
  // Count consecutive occurrences (at least 2 weeks apart = same vrat cycle)
  return rows.length;
}

// ── Mantra Logs ───────────────────────────────────────────────────────────────

export async function saveMantraLog(
  mantraName: string,
  count: number,
  date: string,
  durationMinutes?: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO mantra_logs (mantra_name, count, duration_minutes, date) VALUES (?, ?, ?, ?)`,
    [mantraName, count, durationMinutes ?? null, date]
  );
}

export async function getMantraHistory(days = 30): Promise<MantraLog[]> {
  const db = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];
  const rows = await db.getAllAsync<MantraLog>(
    `SELECT * FROM mantra_logs WHERE date >= ? ORDER BY date DESC, created_at DESC`,
    [sinceStr]
  );
  return rows ?? [];
}

export async function getMantraTotals(): Promise<{ mantra_name: string; total: number }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ mantra_name: string; total: number }>(
    `SELECT mantra_name, SUM(count) as total FROM mantra_logs GROUP BY mantra_name ORDER BY total DESC`
  );
  return rows ?? [];
}
