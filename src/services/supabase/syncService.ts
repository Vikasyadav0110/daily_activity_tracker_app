/**
 * Bi-directional sync: SQLite (local) ↔ Supabase (cloud).
 *
 * Strategy:
 * - Push: local changes since last_sync_at → upsert to Supabase
 * - Pull: cloud changes since last_sync_at → upsert to local SQLite
 * - Conflict: latest updated_at wins
 * - Offline queue: changes written locally while offline are pushed on next sync
 */
import { supabase } from './client';
import { getDatabase } from '@services/db/database';

export type SyncResult = {
  pushed: number;
  pulled: number;
  conflicts: number;
  error?: string;
};

/** Push pending local changes to Supabase. */
async function pushChanges(userId: string, since: string): Promise<number> {
  const db = await getDatabase();

  // New/updated activities since last sync
  const activities: Array<{
    id: number; name: string; category: string | null;
    icon: string | null; frequency: string | null;
    target_duration: number | null; is_archived: number;
    created_at: string; updated_at: string;
  }> = await db.getAllAsync(
    `SELECT * FROM activities WHERE updated_at > ? ORDER BY updated_at ASC`,
    [since]
  );

  if (activities.length > 0) {
    const rows = activities.map((a) => ({
      user_id: userId,
      local_id: a.id,
      name: a.name,
      category: a.category,
      icon: a.icon,
      frequency: a.frequency,
      target_duration: a.target_duration,
      is_archived: Boolean(a.is_archived),
      updated_at: a.updated_at,
    }));
    await supabase
      .from('cloud_activities')
      .upsert(rows, { onConflict: 'user_id,local_id' });
  }

  // New logs since last sync
  const logs: Array<{
    activity_id: number; log_date: string;
    duration_minutes: number | null; quantity: number | null;
    status: string; notes: string | null; created_at: string;
  }> = await db.getAllAsync(
    `SELECT * FROM activity_logs WHERE created_at > ? ORDER BY created_at ASC LIMIT 500`,
    [since]
  );

  let pushed = activities.length;

  if (logs.length > 0) {
    // Need cloud UUIDs for activity_ids
    const localIds = [...new Set(logs.map((l) => l.activity_id))];
    const { data: cloudActivities } = await supabase
      .from('cloud_activities')
      .select('id, local_id')
      .eq('user_id', userId)
      .in('local_id', localIds);

    const localToCloudId = new Map<number, string>(
      (cloudActivities ?? []).map((ca) => [ca.local_id as number, ca.id as string])
    );

    const logRows = logs
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
        updated_at: l.created_at,
      }));

    if (logRows.length > 0) {
      await supabase
        .from('cloud_activity_logs')
        .upsert(logRows, { onConflict: 'user_id,cloud_activity_id,log_date' });
      pushed += logRows.length;
    }
  }

  return pushed;
}

/** Pull cloud changes and upsert to local SQLite. */
async function pullChanges(userId: string, since: string): Promise<{ pulled: number; conflicts: number }> {
  const db = await getDatabase();
  let pulled = 0;
  let conflicts = 0;

  // Pull activities from cloud
  const { data: cloudActivities } = await supabase
    .from('cloud_activities')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since);

  for (const ca of cloudActivities ?? []) {
    if (!ca.local_id) continue; // cloud-only entry, skip

    // Check local version
    const local: { updated_at: string } | undefined = await db.getFirstAsync(
      'SELECT updated_at FROM activities WHERE id = ?',
      [ca.local_id]
    ) ?? undefined;

    if (local && local.updated_at > ca.updated_at) {
      // Local is newer — conflict, keep local
      conflicts++;
      continue;
    }

    // Cloud wins — upsert to local
    await db.runAsync(
      `INSERT OR REPLACE INTO activities
         (id, name, category, icon, frequency, target_duration, is_archived, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ca.local_id, ca.name, ca.category, ca.icon,
        ca.frequency, ca.target_duration,
        ca.is_archived ? 1 : 0, ca.updated_at,
      ]
    );
    pulled++;
  }

  // Pull logs from cloud
  const { data: cloudLogs } = await supabase
    .from('cloud_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .gt('created_at', since);

  for (const cl of cloudLogs ?? []) {
    if (!cl.local_activity_id) continue;

    // Idempotent upsert — UNIQUE(activity_id, log_date)
    await db.runAsync(
      `INSERT OR IGNORE INTO activity_logs
         (activity_id, log_date, duration_minutes, quantity, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cl.local_activity_id, cl.log_date,
        cl.duration_minutes, cl.quantity,
        cl.status, cl.notes, cl.created_at,
      ]
    );
    pulled++;
  }

  return { pulled, conflicts };
}

/** Full bi-directional sync. Safe to call repeatedly — idempotent. */
export async function syncNow(userId: string): Promise<SyncResult> {
  try {
    // Get last sync time
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('last_sync_at')
      .eq('user_id', userId)
      .maybeSingle();

    const since = syncState?.last_sync_at ?? '1970-01-01T00:00:00.000Z';
    const now = new Date().toISOString();

    const pushed = await pushChanges(userId, since);
    const { pulled, conflicts } = await pullChanges(userId, since);

    // Update last sync timestamp
    await supabase.from('sync_state').upsert({
      user_id: userId,
      last_sync_at: now,
      activities_synced: pushed,
      logs_synced: pulled,
    });

    return { pushed, pulled, conflicts };
  } catch (e) {
    return { pushed: 0, pulled: 0, conflicts: 0, error: String(e) };
  }
}

/** Flush any queued offline changes. Call when network becomes available. */
export async function flushOfflineQueue(userId: string): Promise<void> {
  // In Phase 2 the offline queue = all local writes since last_sync_at
  // syncNow already handles this — just call it
  await syncNow(userId);
}
