import { getDatabase } from './database';

export interface MoodLog {
  id: number;
  date: string;
  mood_rating: number;
  energy_level: number;
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityMoodCorrelation {
  activity_name: string;
  activity_icon: string;
  avg_mood_on_days: number;
  avg_mood_off_days: number;
  sample_size: number;
  correlation: number; // positive means activity improves mood
}

export async function saveMoodLog(
  date: string,
  moodRating: number,
  energyLevel: number,
  sleepQuality?: number | null,
  notes?: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO mood_logs (date, mood_rating, energy_level, sleep_quality, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [date, moodRating, energyLevel, sleepQuality ?? null, notes ?? null]
  );
}

export async function getMoodForDate(date: string): Promise<MoodLog | null> {
  const db = await getDatabase();
  return db.getFirstAsync<MoodLog>(
    `SELECT * FROM mood_logs WHERE date = ?`,
    [date]
  );
}

export async function getMoodHistory(days = 30): Promise<MoodLog[]> {
  const db = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];
  const rows = await db.getAllAsync<MoodLog>(
    `SELECT * FROM mood_logs WHERE date >= ? ORDER BY date ASC`,
    [sinceStr]
  );
  return rows ?? [];
}

export async function getAverageMood(days = 30): Promise<{ avg_mood: number; avg_energy: number; sample: number }> {
  const db = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];
  const row = await db.getFirstAsync<{ avg_mood: number; avg_energy: number; cnt: number }>(
    `SELECT AVG(mood_rating) as avg_mood, AVG(energy_level) as avg_energy, COUNT(*) as cnt
     FROM mood_logs WHERE date >= ?`,
    [sinceStr]
  );
  return { avg_mood: row?.avg_mood ?? 0, avg_energy: row?.avg_energy ?? 0, sample: row?.cnt ?? 0 };
}

/**
 * Pearson-like correlation: compare avg mood on days activity was done vs not done.
 * Returns top correlations (positive = activity boosts mood).
 */
export async function getMoodActivityCorrelations(days = 30): Promise<ActivityMoodCorrelation[]> {
  const db = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  // Get all dates with mood logs in range
  const moodLogs = await db.getAllAsync<{ date: string; mood_rating: number }>(
    `SELECT date, mood_rating FROM mood_logs WHERE date >= ? ORDER BY date`,
    [sinceStr]
  );
  if (moodLogs.length < 5) return []; // Not enough data

  const moodByDate: Record<string, number> = {};
  for (const m of moodLogs) moodByDate[m.date] = m.mood_rating;
  const moodDates = Object.keys(moodByDate);

  // Get all activities
  const activities = await db.getAllAsync<{ id: number; name: string; icon: string }>(
    `SELECT id, name, icon FROM activities WHERE is_archived = 0`
  );

  const results: ActivityMoodCorrelation[] = [];

  for (const activity of activities) {
    // Get dates this activity was completed
    const doneDates = new Set(
      (await db.getAllAsync<{ log_date: string }>(
        `SELECT log_date FROM activity_logs WHERE activity_id = ? AND status = 'completed' AND log_date >= ?`,
        [activity.id, sinceStr]
      )).map((r) => r.log_date)
    );

    const onDays = moodDates.filter((d) => doneDates.has(d));
    const offDays = moodDates.filter((d) => !doneDates.has(d));

    if (onDays.length < 3) continue; // Need at least 3 data points

    const avgOn = onDays.reduce((s, d) => s + moodByDate[d], 0) / onDays.length;
    const avgOff = offDays.length > 0
      ? offDays.reduce((s, d) => s + moodByDate[d], 0) / offDays.length
      : avgOn;

    const correlation = avgOn - avgOff; // simple difference as proxy for correlation

    results.push({
      activity_name: activity.name,
      activity_icon: activity.icon,
      avg_mood_on_days: Math.round(avgOn * 10) / 10,
      avg_mood_off_days: Math.round(avgOff * 10) / 10,
      sample_size: onDays.length,
      correlation: Math.round(correlation * 100) / 100,
    });
  }

  // Sort by strongest positive correlation first
  return results.sort((a, b) => b.correlation - a.correlation).slice(0, 5);
}
