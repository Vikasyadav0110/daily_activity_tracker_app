import { getDatabase } from './database';
import type { Dosha } from '@services/wellness/ayurvedaService';

export interface DoshaProfile {
  id: number;
  primary_dosha: Dosha;
  secondary_dosha: Dosha | null;
  determined_via: 'quiz' | 'admin';
  created_at: string;
}

export interface CoachMessage {
  id: string;
  message_type: 'miss_streak' | 'plan_recalibration' | 'encouragement';
  message_text: string;
  triggered_reason: string | null;
  was_sent_at: string;
  was_opened: number;
  user_acted: number;
  created_at: string;
}

export interface ScheduledPlan {
  id: string;
  plan_name: string;
  plan_json: string;
  plan_type: 'ai_generated' | 'user_custom';
  status: 'active' | 'archived';
  adherence_rate: number;
  start_date: string;
  created_at: string;
}

// ── Dosha Profile ─────────────────────────────────────────────────────────────

export async function saveDoshaProfile(primary: Dosha, secondary: Dosha | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO dosha_profiles (id, primary_dosha, secondary_dosha, determined_via) VALUES (1, ?, ?, 'quiz')`,
    [primary, secondary ?? null]
  );
}

export async function getDoshaProfile(): Promise<DoshaProfile | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DoshaProfile>(`SELECT * FROM dosha_profiles WHERE id = 1`);
}

// ── Coach Messages ─────────────────────────────────────────────────────────────

export async function saveCoachMessage(
  id: string,
  messageType: CoachMessage['message_type'],
  messageText: string,
  triggeredReason?: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ai_coach_messages
     (id, message_type, message_text, triggered_reason, was_opened, user_acted)
     VALUES (?, ?, ?, ?, 0, 0)`,
    [id, messageType, messageText, triggeredReason ?? null]
  );
}

export async function getPendingCoachMessages(limit = 3): Promise<CoachMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CoachMessage>(
    `SELECT * FROM ai_coach_messages WHERE was_opened = 0 ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows ?? [];
}

export async function markCoachMessageOpened(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE ai_coach_messages SET was_opened = 1 WHERE id = ?`, [id]);
}

export async function markCoachMessageActed(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE ai_coach_messages SET user_acted = 1, was_opened = 1 WHERE id = ?`, [id]);
}

// ── Scheduled Plans ─────────────────────────────────────────────────────────────

export async function saveScheduledPlan(
  id: string,
  planName: string,
  planJson: object,
  startDate: string,
  planType: ScheduledPlan['plan_type'] = 'ai_generated'
): Promise<void> {
  const db = await getDatabase();
  // Archive existing active plan
  await db.runAsync(`UPDATE scheduled_plans SET status = 'archived' WHERE status = 'active'`);
  await db.runAsync(
    `INSERT OR REPLACE INTO scheduled_plans (id, plan_name, plan_json, plan_type, status, start_date)
     VALUES (?, ?, ?, ?, 'active', ?)`,
    [id, planName, JSON.stringify(planJson), planType, startDate]
  );
}

export async function getActivePlan(): Promise<ScheduledPlan | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ScheduledPlan>(
    `SELECT * FROM scheduled_plans WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`
  );
}

export async function getPlanHistory(): Promise<ScheduledPlan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ScheduledPlan>(
    `SELECT * FROM scheduled_plans ORDER BY created_at DESC LIMIT 10`
  );
  return rows ?? [];
}
