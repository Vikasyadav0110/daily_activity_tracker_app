import { getDatabase } from './database';
import { getTodayIST } from '@utils/dateUtils';

export type LogStatus = 'completed' | 'skipped' | 'missed';

export interface ActivityLog {
  id: number;
  activity_id: number;
  log_date: string;
  duration_minutes: number | null;
  quantity: number | null;
  status: LogStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogActivityOptions {
  duration_minutes?: number;
  quantity?: number;
  notes?: string;
  status?: LogStatus;
}

export async function logActivity(
  activityId: number,
  date: string = getTodayIST(),
  opts: LogActivityOptions = {}
): Promise<ActivityLog> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO activity_logs
       (activity_id, log_date, duration_minutes, quantity, status, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      activityId,
      date,
      opts.duration_minutes ?? null,
      opts.quantity ?? null,
      opts.status ?? 'completed',
      opts.notes ?? null,
    ]
  );

  const log = await getLogForDate(activityId, date);
  if (!log) throw new Error('Failed to create log');
  return log;
}

export async function getLogForDate(
  activityId: number,
  date: string
): Promise<ActivityLog | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ActivityLog>(
    `SELECT * FROM activity_logs WHERE activity_id = ? AND log_date = ?`,
    [activityId, date]
  );
}

export async function getLogsForDate(date: string): Promise<ActivityLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM activity_logs WHERE log_date = ? ORDER BY created_at ASC`,
    [date]
  );
}

export async function getLogsForRange(
  startDate: string,
  endDate: string
): Promise<ActivityLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM activity_logs
     WHERE log_date >= ? AND log_date <= ?
     ORDER BY log_date ASC`,
    [startDate, endDate]
  );
}

export async function getLogsForActivity(
  activityId: number,
  limit = 90
): Promise<ActivityLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM activity_logs
     WHERE activity_id = ?
     ORDER BY log_date DESC
     LIMIT ?`,
    [activityId, limit]
  );
}

export async function deleteLog(activityId: number, date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM activity_logs WHERE activity_id = ? AND log_date = ?`,
    [activityId, date]
  );
}

export async function getTodaysLogs(): Promise<ActivityLog[]> {
  return getLogsForDate(getTodayIST());
}

export async function isLoggedToday(activityId: number): Promise<boolean> {
  const log = await getLogForDate(activityId, getTodayIST());
  return log !== null && log.status === 'completed';
}
