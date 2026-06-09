import { supabase } from '@services/supabase/client';
import {
  saveInsight,
  getInsightForWeek,
  getInsightHistory,
  markInsightViewed,
  markInsightActedUpon,
  type AiInsight,
} from '@services/db/insightsRepo';

export type { AiInsight };

/** Returns Monday of the week containing `date`. */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export interface WeeklyReviewResult {
  id: string;
  insight_title: string;
  insight_text: string;
  xp_reward: number;
  cached: boolean;
}

/**
 * Fetch (or generate) the AI weekly review for the given week.
 * Checks local SQLite cache first; if missing, calls the Edge Function.
 */
export async function fetchWeeklyReview(weekStart?: string): Promise<WeeklyReviewResult | null> {
  const ws = weekStart ?? getWeekStart();

  // Local cache hit
  const cached = await getInsightForWeek(ws);
  if (cached) {
    return {
      id: cached.id,
      insight_title: cached.insight_title,
      insight_text: cached.insight_text,
      xp_reward: cached.xp_reward,
      cached: true,
    };
  }

  // Call Edge Function (requires signed-in session)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('generate-weekly-review', {
    body: { week_start: ws },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error || !data) return null;

  const result = data as { id: string; insight_title: string; insight_text: string; xp_reward: number };

  // Persist to local cache
  await saveInsight({
    id: result.id,
    insight_week_start: ws,
    insight_type: 'weekly_review',
    insight_title: result.insight_title,
    insight_text: result.insight_text,
    insight_data: null,
    xp_reward: result.xp_reward,
    was_acted_upon: 0,
    viewed_at: null,
  });

  return { ...result, cached: false };
}

export async function getInsights(limit?: number): Promise<AiInsight[]> {
  return getInsightHistory(limit);
}

export async function viewInsight(id: string): Promise<void> {
  await markInsightViewed(id);
  // Best-effort cloud update
  supabase.from('ai_insights').update({ viewed_at: new Date().toISOString() }).eq('id', id).then(() => {});
}

export async function actOnInsight(id: string): Promise<void> {
  await markInsightActedUpon(id);
  supabase.from('ai_insights').update({ was_acted_upon: true }).eq('id', id).then(() => {});
}
