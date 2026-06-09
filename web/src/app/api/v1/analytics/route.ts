import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/analytics?days=30
// Returns: completion_rate, streak, daily_breakdown, per_activity_stats, mood_trend
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const days = Math.min(parseInt(sp.get('days') ?? '30', 10), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  // Fetch activities + logs in parallel
  const [activitiesRes, logsRes, moodsRes] = await Promise.all([
    supabase.from('activities').select('id, name, icon, color, target_count, frequency').eq('user_id', auth.userId).eq('is_active', true),
    supabase.from('activity_logs').select('activity_id, log_date, completed_count').eq('user_id', auth.userId).gte('log_date', sinceStr).order('log_date'),
    supabase.from('mood_logs').select('log_date, mood_rating, energy_level').eq('user_id', auth.userId).gte('log_date', sinceStr).order('log_date'),
  ]);

  if (activitiesRes.error) return apiError(activitiesRes.error.message, 500);
  if (logsRes.error) return apiError(logsRes.error.message, 500);

  const activities = activitiesRes.data ?? [];
  const logs = logsRes.data ?? [];
  const moods = moodsRes.data ?? [];

  // Build a date→{activityId→count} map
  const byDate: Record<string, Record<string, number>> = {};
  for (const log of logs) {
    byDate[log.log_date] ??= {};
    byDate[log.log_date][log.activity_id] = (byDate[log.log_date][log.activity_id] ?? 0) + log.completed_count;
  }

  // Daily completion %
  const allDates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    allDates.unshift(d.toISOString().slice(0, 10));
  }

  const daily_breakdown = allDates.map((date) => {
    const dayLogs = byDate[date] ?? {};
    const completed = activities.filter((a) => (dayLogs[a.id] ?? 0) >= a.target_count).length;
    return { date, completed, total: activities.length, pct: activities.length ? Math.round((completed / activities.length) * 100) : 0 };
  });

  // Overall completion rate
  const totalSlots = daily_breakdown.reduce((s, d) => s + d.total, 0);
  const totalCompleted = daily_breakdown.reduce((s, d) => s + d.completed, 0);
  const completion_rate = totalSlots ? Math.round((totalCompleted / totalSlots) * 100) : 0;

  // Streak — consecutive days from today backwards where pct = 100
  let streak = 0;
  for (let i = daily_breakdown.length - 1; i >= 0; i--) {
    if (daily_breakdown[i].pct === 100) streak++; else break;
  }

  // Per-activity stats
  const per_activity_stats = activities.map((a) => {
    const completedDays = logs.filter((l) => l.activity_id === a.id && l.completed_count >= a.target_count).length;
    const total_logged = logs.filter((l) => l.activity_id === a.id).reduce((s, l) => s + l.completed_count, 0);
    return { id: a.id, name: a.name, icon: a.icon, color: a.color, completed_days: completedDays, total_logged, completion_rate: Math.round((completedDays / days) * 100) };
  });

  // Mood trend
  const mood_trend = moods.map((m) => ({ date: m.log_date, mood: m.mood_rating, energy: m.energy_level }));

  return apiOk({ completion_rate, streak, days, per_activity_stats, daily_breakdown, mood_trend });
}
