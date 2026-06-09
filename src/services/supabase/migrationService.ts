/**
 * Phase 1 → Phase 2 migration service.
 * On first login, bulk-upload the user's local SQLite data to Supabase.
 * Local SQLite is never deleted — it continues as the offline cache.
 */
import { supabase } from './client';
import { getDatabase } from '@services/db/database';

export type MigrationProgress = {
  step: string;
  current: number;
  total: number;
};

type ProgressCallback = (progress: MigrationProgress) => void;

export async function migrateLocalDataToCloud(
  userId: string,
  onProgress?: ProgressCallback
): Promise<{ activitiesMigrated: number; logsMigrated: number }> {
  const db = await getDatabase();

  // --- 1. Upsert user profile row ---
  onProgress?.({ step: 'profile', current: 0, total: 1 });
  await supabase
    .from('users')
    .upsert({ id: userId, email: (await supabase.auth.getUser()).data.user?.email ?? '', is_local_only: false })
    .eq('id', userId);

  // --- 2. Migrate activities ---
  const activities: Array<{
    id: number;
    name: string;
    category: string | null;
    icon: string | null;
    frequency: string | null;
    target_duration: number | null;
    is_archived: number;
    created_at: string;
    updated_at: string;
  }> = await db.getAllAsync('SELECT * FROM activities WHERE is_archived = 0');

  onProgress?.({ step: 'activities', current: 0, total: activities.length });

  const cloudActivityRows = activities.map((a) => ({
    user_id: userId,
    local_id: a.id,
    name: a.name,
    category: a.category,
    icon: a.icon,
    frequency: a.frequency,
    target_duration: a.target_duration,
    is_archived: false,
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));

  let activitiesUpserted = 0;
  // Batch upsert in chunks of 100
  for (let i = 0; i < cloudActivityRows.length; i += 100) {
    const chunk = cloudActivityRows.slice(i, i + 100);
    const { error } = await supabase
      .from('cloud_activities')
      .upsert(chunk, { onConflict: 'user_id,local_id' });
    if (!error) activitiesUpserted += chunk.length;
    onProgress?.({ step: 'activities', current: Math.min(i + 100, activities.length), total: activities.length });
  }

  // Build local_id → cloud UUID map for log migration
  const { data: cloudActivities } = await supabase
    .from('cloud_activities')
    .select('id, local_id')
    .eq('user_id', userId);

  const localToCloudId = new Map<number, string>(
    (cloudActivities ?? []).map((ca) => [ca.local_id as number, ca.id as string])
  );

  // --- 3. Migrate activity logs ---
  const logs: Array<{
    activity_id: number;
    log_date: string;
    duration_minutes: number | null;
    quantity: number | null;
    status: string;
    notes: string | null;
    created_at: string;
  }> = await db.getAllAsync('SELECT * FROM activity_logs ORDER BY log_date DESC LIMIT 10000');

  onProgress?.({ step: 'logs', current: 0, total: logs.length });

  const cloudLogRows = logs
    .filter((l) => localToCloudId.has(l.activity_id))
    .map((l) => ({
      user_id: userId,
      cloud_activity_id: localToCloudId.get(l.activity_id)!,
      local_activity_id: l.activity_id,
      log_date: l.log_date,
      duration_minutes: l.duration_minutes,
      quantity: l.quantity,
      status: l.status,
      notes: l.notes,
      created_at: l.created_at,
    }));

  let logsUpserted = 0;
  for (let i = 0; i < cloudLogRows.length; i += 100) {
    const chunk = cloudLogRows.slice(i, i + 100);
    const { error } = await supabase
      .from('cloud_activity_logs')
      .upsert(chunk, { onConflict: 'user_id,cloud_activity_id,log_date' });
    if (!error) logsUpserted += chunk.length;
    onProgress?.({ step: 'logs', current: Math.min(i + 100, logs.length), total: logs.length });
  }

  // --- 4. Record sync state ---
  await supabase.from('sync_state').upsert({
    user_id: userId,
    last_sync_at: new Date().toISOString(),
    activities_synced: activitiesUpserted,
    logs_synced: logsUpserted,
  });

  return { activitiesMigrated: activitiesUpserted, logsMigrated: logsUpserted };
}

export async function hasMigratedToCloud(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('sync_state')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data !== null;
}
