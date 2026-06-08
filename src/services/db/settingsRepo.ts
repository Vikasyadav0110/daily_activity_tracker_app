import { getDatabase } from './database';

export interface AppSettings {
  id: number;
  user_id: string | null;
  language: string;
  theme: 'light' | 'dark';
  timezone: string;
  notification_enabled: boolean;
  reminder_times: ReminderTime[];
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderTime {
  activity_id: number;
  time: string; // "HH:MM" 24h format
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM app_settings WHERE id = 1`
  );

  if (!row) {
    await db.runAsync(
      `INSERT INTO app_settings (id, language, theme) VALUES (1, 'en', 'light')`
    );
    return getSettings();
  }

  return normalizeSettings(row);
}

export async function updateSettings(
  updates: Partial<Omit<AppSettings, 'id' | 'created_at'>>
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.language !== undefined) { fields.push('language = ?'); values.push(updates.language); }
  if (updates.theme !== undefined) { fields.push('theme = ?'); values.push(updates.theme); }
  if (updates.timezone !== undefined) { fields.push('timezone = ?'); values.push(updates.timezone); }
  if (updates.notification_enabled !== undefined) {
    fields.push('notification_enabled = ?');
    values.push(updates.notification_enabled ? 1 : 0);
  }
  if (updates.reminder_times !== undefined) {
    fields.push('reminder_times = ?');
    values.push(JSON.stringify(updates.reminder_times));
  }
  if (updates.onboarding_complete !== undefined) {
    fields.push('onboarding_complete = ?');
    values.push(updates.onboarding_complete ? 1 : 0);
  }
  if (updates.user_id !== undefined) { fields.push('user_id = ?'); values.push(updates.user_id); }

  if (fields.length === 0) return;
  values.push(1); // WHERE id = 1

  await db.runAsync(
    `UPDATE app_settings SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    values as (string | number | null)[]
  );
}

function normalizeSettings(row: Record<string, unknown>): AppSettings {
  let reminderTimes: ReminderTime[] = [];
  try {
    reminderTimes = JSON.parse((row.reminder_times as string) || '[]');
  } catch {
    reminderTimes = [];
  }

  return {
    id: row.id as number,
    user_id: (row.user_id as string | null) ?? null,
    language: (row.language as string) || 'en',
    theme: ((row.theme as string) === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
    timezone: (row.timezone as string) || 'Asia/Kolkata',
    notification_enabled:
      row.notification_enabled === 1 || row.notification_enabled === true,
    reminder_times: reminderTimes,
    onboarding_complete:
      row.onboarding_complete === 1 || row.onboarding_complete === true,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
