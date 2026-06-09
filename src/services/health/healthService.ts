/**
 * Health Sync Service
 *
 * Unified interface over Apple Health (iOS) and Google Fit (Android).
 *
 * NATIVE SETUP REQUIRED to activate:
 *   iOS:  Install `react-native-health` + add HealthKit entitlement in app.json
 *         Expo Config Plugin: @kingstinct/react-native-healthkit
 *   Android: Install `react-native-google-fit` + OAuth credentials
 *
 * Until native modules are wired in, all adapters return isAvailable() = false
 * and health sync is silently skipped. The settings UI shows "Not available on
 * this device" until the native module responds.
 *
 * To activate: replace NoOpAdapter below with:
 *   import { AppleHealthAdapter } from './appleHealthAdapter';
 *   import { GoogleFitAdapter } from './googleFitAdapter';
 */
import { Platform } from 'react-native';
import { getDatabase } from '@services/db/database';
import { getTodayIST, addDays } from '@utils/dateUtils';
import type { HealthAdapter, HealthPlatform, HealthSyncResult } from './types';

class NoOpAdapter implements HealthAdapter {
  async isAvailable() { return false; }
  async requestPermissions() { return false; }
  async getSteps() { return []; }
  async getActiveMinutes() { return []; }
  async getMindfulMinutes() { return []; }
  async writeWorkout() { /* no-op */ }
}

function getAdapter(): HealthAdapter {
  // Swap with real adapters once native modules are installed:
  // if (Platform.OS === 'ios') return new AppleHealthAdapter();
  // if (Platform.OS === 'android') return new GoogleFitAdapter();
  void Platform.OS; // referenced for future conditional
  return new NoOpAdapter();
}

export function getHealthPlatform(): HealthPlatform {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'android') return 'google_fit';
  return 'none';
}

export async function isHealthAvailable(): Promise<boolean> {
  return getAdapter().isAvailable();
}

export async function requestHealthPermissions(): Promise<boolean> {
  return getAdapter().requestPermissions();
}

/**
 * Sync last N days of steps + active minutes from health platform.
 * Maps to activity logs for fitness-category activities.
 *
 * Matching logic: if user has a fitness activity named "Steps" or "Walking",
 * step data maps to it. Active minutes map to any fitness activity.
 */
export async function syncFromHealth(days = 7): Promise<HealthSyncResult> {
  const platform = getHealthPlatform();
  const adapter = getAdapter();

  const available = await adapter.isAvailable();
  if (!available) {
    return { platform, synced: 0, skipped: 0, error: 'Health platform not available' };
  }

  const hasPermission = await adapter.requestPermissions();
  if (!hasPermission) {
    return { platform, synced: 0, skipped: 0, error: 'Permission denied' };
  }

  const today = getTodayIST();
  const startDate = addDays(today, -days);

  try {
    const [steps, activeMinutes] = await Promise.all([
      adapter.getSteps(startDate, today),
      adapter.getActiveMinutes(startDate, today),
    ]);

    const db = await getDatabase();

    // Find fitness activities to map health data to
    const fitnessActivities = await db.getAllAsync<{ id: number; name: string }>(
      `SELECT id, name FROM activities WHERE category = 'fitness' AND is_archived = 0 LIMIT 5`
    );

    if (fitnessActivities.length === 0) {
      return { platform, synced: 0, skipped: steps.length + activeMinutes.length };
    }

    let synced = 0;
    const targetActivity = fitnessActivities[0];

    // Write active minutes as duration logs
    for (const sample of activeMinutes) {
      if (sample.value < 5) continue; // skip trivial

      const existing = await db.getFirstAsync(
        'SELECT id FROM activity_logs WHERE activity_id = ? AND log_date = ?',
        [targetActivity.id, sample.date]
      );

      if (!existing) {
        await db.runAsync(
          `INSERT OR IGNORE INTO activity_logs
             (activity_id, log_date, duration_minutes, status)
           VALUES (?, ?, ?, 'completed')`,
          [targetActivity.id, sample.date, Math.round(sample.value)]
        );
        synced++;
      }
    }

    return { platform, synced, skipped: activeMinutes.length - synced };
  } catch (e) {
    return { platform, synced: 0, skipped: 0, error: String(e) };
  }
}

/**
 * Write a completed activity back to Apple Health / Google Fit.
 * Called after user checks off a fitness activity with duration.
 */
export async function writeActivityToHealth(
  durationMinutes: number,
  date: string
): Promise<void> {
  const adapter = getAdapter();
  const available = await adapter.isAvailable().catch(() => false);
  if (!available) return;
  await adapter.writeWorkout(date, durationMinutes).catch(() => {/* non-critical */});
}
