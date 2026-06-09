import { supabase } from '@services/supabase/client';
import {
  saveCoachMessage,
  getPendingCoachMessages,
  markCoachMessageOpened,
  markCoachMessageActed,
  type CoachMessage,
} from '@services/db/wellnessRepo';

export type { CoachMessage };

export interface CoachNudgeResult {
  id: string;
  message_type: 'miss_streak' | 'plan_recalibration' | 'encouragement';
  message_text: string;
  triggered_reason: string | null;
}

/** Fetch a coach nudge from the Edge Function and cache it locally. */
export async function fetchCoachNudge(): Promise<CoachNudgeResult | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('generate-coach-nudge', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error || !data || !data.id) return null;

  const result = data as CoachNudgeResult;

  await saveCoachMessage(
    result.id,
    result.message_type,
    result.message_text,
    result.triggered_reason
  );

  return result;
}

export async function getPendingNudges(): Promise<CoachMessage[]> {
  return getPendingCoachMessages();
}

export async function openNudge(id: string): Promise<void> {
  await markCoachMessageOpened(id);
  supabase.from('ai_coach_messages').update({ was_opened: true }).eq('id', id).then(() => {});
}

export async function actOnNudge(id: string): Promise<void> {
  await markCoachMessageActed(id);
  supabase.from('ai_coach_messages').update({ user_acted: true, was_opened: true }).eq('id', id).then(() => {});
}
