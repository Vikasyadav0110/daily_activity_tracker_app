import { getDatabase } from './database';
import { addDays, getTodayIST } from '@utils/dateUtils';

export interface WeeklyTrend {
  week: string;   // ISO week label e.g. "W23"
  startDate: string;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  completed: number;
  total: number;
  rate: number; // 0-1
}

export interface HourBucket {
  hour: number;  // 0-23
  count: number;
}

export interface GoalVsActual {
  activityId: number;
  name: string;
  icon: string;
  targetMinutes: number;
  avgActualMinutes: number;
  logsWithDuration: number;
}

/** Last N weeks of daily completions, aggregated per week. */
export async function getWeeklyTrend(weeks = 8): Promise<WeeklyTrend[]> {
  const db = await getDatabase();
  const today = getTodayIST();
  const since = addDays(today, -(weeks * 7));

  const rows = await db.getAllAsync<{ log_date: string; count: number }>(
    `SELECT log_date, COUNT(*) as count
     FROM activity_logs
     WHERE status = 'completed' AND log_date >= ?
     GROUP BY log_date
     ORDER BY log_date ASC`,
    [since]
  );

  // Bucket into ISO weeks
  const buckets = new Map<string, { startDate: string; count: number }>();
  for (const row of rows) {
    const d = new Date(row.log_date + 'T00:00:00');
    const weekNum = getISOWeek(d);
    const key = `W${String(weekNum).padStart(2, '0')}`;
    const existing = buckets.get(key);
    // Use the earliest date in the week as label anchor
    const isoMonday = getMondayOfWeek(d);
    buckets.set(key, {
      startDate: existing?.startDate ?? isoMonday,
      count: (existing?.count ?? 0) + row.count,
    });
  }

  // Fill missing weeks with 0
  const result: WeeklyTrend[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(today, -(i * 7 + getDayOfWeek(new Date(today + 'T00:00:00'))));
    const weekNum = getISOWeek(new Date(weekStart + 'T00:00:00'));
    const key = `W${String(weekNum).padStart(2, '0')}`;
    result.push({
      week: key,
      startDate: weekStart,
      count: buckets.get(key)?.count ?? 0,
    });
  }
  return result;
}

/** Completion rate per category for the last N days. */
export async function getCategoryBreakdown(days = 30): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const today = getTodayIST();
  const since = addDays(today, -days);

  const rows = await db.getAllAsync<{
    category: string;
    completed: number;
    total: number;
  }>(
    `SELECT a.category,
            SUM(CASE WHEN al.status = 'completed' THEN 1 ELSE 0 END) as completed,
            COUNT(*) as total
     FROM activity_logs al
     JOIN activities a ON al.activity_id = a.id
     WHERE al.log_date >= ?
     GROUP BY a.category
     ORDER BY completed DESC`,
    [since]
  );

  return rows.map((r) => ({
    category: r.category,
    completed: r.completed,
    total: r.total,
    rate: r.total > 0 ? r.completed / r.total : 0,
  }));
}

/** Distribution of logs by hour of day (from created_at). */
export async function getHourDistribution(days = 30): Promise<HourBucket[]> {
  const db = await getDatabase();
  const today = getTodayIST();
  const since = addDays(today, -days);

  const rows = await db.getAllAsync<{ hour: number; count: number }>(
    `SELECT CAST(strftime('%H', created_at, 'localtime') AS INTEGER) as hour,
            COUNT(*) as count
     FROM activity_logs
     WHERE status = 'completed' AND log_date >= ?
     GROUP BY hour
     ORDER BY hour ASC`,
    [since]
  );

  const map = new Map(rows.map((r) => [r.hour, r.count]));
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: map.get(h) ?? 0 }));
}

/** Goal vs actual duration per activity (only those with target_duration set and logged durations). */
export async function getGoalVsActual(): Promise<GoalVsActual[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    activity_id: number;
    name: string;
    icon: string;
    target_duration: number;
    avg_actual: number | null;
    logs_with_duration: number;
  }>(
    `SELECT a.id as activity_id, a.name, a.icon, a.target_duration,
            AVG(al.duration_minutes) as avg_actual,
            COUNT(al.duration_minutes) as logs_with_duration
     FROM activities a
     LEFT JOIN activity_logs al ON a.id = al.activity_id
       AND al.status = 'completed' AND al.duration_minutes IS NOT NULL
     WHERE a.is_archived = 0 AND a.target_duration IS NOT NULL
     GROUP BY a.id
     ORDER BY a.name ASC`
  );

  return rows
    .filter((r) => r.logs_with_duration > 0)
    .map((r) => ({
      activityId: r.activity_id,
      name: r.name,
      icon: r.icon,
      targetMinutes: r.target_duration,
      avgActualMinutes: Math.round(r.avg_actual ?? 0),
      logsWithDuration: r.logs_with_duration,
    }));
}

/** Raw logs for CSV export — all completed logs in the last N days. */
export async function getLogsForExport(days = 90): Promise<
  Array<{ date: string; activity: string; category: string; duration: number | null; status: string }>
> {
  const db = await getDatabase();
  const today = getTodayIST();
  const since = addDays(today, -days);

  return db.getAllAsync(
    `SELECT al.log_date as date, a.name as activity, a.category,
            al.duration_minutes as duration, al.status
     FROM activity_logs al
     JOIN activities a ON al.activity_id = a.id
     WHERE al.log_date >= ?
     ORDER BY al.log_date DESC, a.name ASC`,
    [since]
  );
}

// ---- helpers ----

function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

function getMondayOfWeek(d: Date): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

function getDayOfWeek(d: Date): number {
  return (d.getDay() + 6) % 7; // Mon=0, Sun=6
}
