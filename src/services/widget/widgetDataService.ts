/**
 * Widget Data Service
 *
 * Writes today's summary JSON to FileSystem so a native widget extension can read it.
 *
 * iOS: Widget extension reads from App Group container at:
 *   group.com.vikas.dailyactivitytracker/widget-data.json
 *   Configure: add App Group entitlement + share FileSystem.sharedContainerDirectory
 *
 * Android: AppWidget reads from SharedPreferences "widget_data" key.
 *   The JSON string written to documentDirectory is synced via a
 *   WidgetManager.updateAppWidget call in the native module.
 *
 * Without native widget extension, this data is silently ignored.
 * The widget extension itself is set up via Expo Config Plugin (see docs/WIDGET_SETUP.md).
 */
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '@services/db/database';
import { getTodayIST } from '@utils/dateUtils';
import { getXPState } from '@services/xp/xpEngine';

export interface WidgetData {
  date: string;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  longestStreakDays: number;
  weekXp: number;
  level: number;
  topActivity: { name: string; icon: string; streak: number } | null;
  lastUpdated: string;
}

const WIDGET_FILE = FileSystem.documentDirectory + 'widget-data.json';

export async function refreshWidgetData(): Promise<WidgetData> {
  const db = await getDatabase();
  const today = getTodayIST();

  // Today's completion rate
  const activities = await db.getAllAsync<{ id: number; name: string; icon: string }>(
    'SELECT id, name, icon FROM activities WHERE is_archived = 0'
  );
  const logs = await db.getAllAsync<{ activity_id: number }>(
    `SELECT activity_id FROM activity_logs WHERE log_date = ? AND status = 'completed'`,
    [today]
  );
  const completedIds = new Set(logs.map((l) => l.activity_id));
  const completedCount = activities.filter((a) => completedIds.has(a.id)).length;
  const totalCount = activities.length;

  // Top streak
  const streakRow = await db.getFirstAsync<{
    activity_id: number;
    current_streak_days: number;
  }>('SELECT activity_id, current_streak_days FROM streaks ORDER BY current_streak_days DESC LIMIT 1');

  const topActivity = streakRow
    ? (() => {
        const act = activities.find((a) => a.id === streakRow.activity_id);
        return act
          ? { name: act.name, icon: act.icon, streak: streakRow.current_streak_days }
          : null;
      })()
    : null;

  const { weekXp, level } = await getXPState();

  const data: WidgetData = {
    date: today,
    completedCount,
    totalCount,
    completionPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    longestStreakDays: streakRow?.current_streak_days ?? 0,
    weekXp,
    level,
    topActivity,
    lastUpdated: new Date().toISOString(),
  };

  // Write to file for native widget extension to read
  await FileSystem.writeAsStringAsync(WIDGET_FILE, JSON.stringify(data), {
    encoding: FileSystem.EncodingType.UTF8,
  }).catch(() => {/* widget file write is non-critical */});

  return data;
}

export async function getLastWidgetData(): Promise<WidgetData | null> {
  try {
    const info = await FileSystem.getInfoAsync(WIDGET_FILE);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(WIDGET_FILE);
    return JSON.parse(content) as WidgetData;
  } catch {
    return null;
  }
}
