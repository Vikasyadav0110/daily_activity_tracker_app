import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };
const MIN_COHORT_SIZE = 5;

// GET /api/v1/org/:org_id/analytics/wellness
// Returns weekly aggregated mood + energy trends for the org
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const { data: o } = await supabase.from('organizations').select('owner_id').eq('id', org_id).maybeSingle();
  if (!o) return apiError('Organization not found', 404);
  if (o.owner_id !== auth.userId) {
    const { data: m } = await supabase
      .from('org_members').select('role').eq('org_id', org_id).eq('user_id', auth.userId).eq('status', 'active').maybeSingle();
    if (m?.role !== 'admin' && m?.role !== 'manager') return apiError('Forbidden', 403);
  }

  const url = new URL(req.url);
  const weeks = Math.min(parseInt(url.searchParams.get('weeks') ?? '12'), 26);
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: members } = await supabase
    .from('org_members').select('user_id').eq('org_id', org_id).eq('status', 'active').not('user_id', 'is', null);
  const userIds = (members ?? []).map((m) => m.user_id as string);

  if (userIds.length < MIN_COHORT_SIZE) {
    return apiError(`Requires at least ${MIN_COHORT_SIZE} active members for wellness analytics.`, 422);
  }

  const { data: moods } = await supabase
    .from('mood_logs')
    .select('date, mood_rating, energy_rating')
    .in('user_id', userIds)
    .gte('date', since)
    .order('date');

  // Bucket by ISO week (YYYY-Www)
  function toISOWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const year = d.getFullYear();
    const week = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  const weekMap: Record<string, { mood_sum: number; energy_sum: number; count: number }> = {};
  for (const m of moods ?? []) {
    const wk = toISOWeek(m.date);
    if (!weekMap[wk]) weekMap[wk] = { mood_sum: 0, energy_sum: 0, count: 0 };
    weekMap[wk].mood_sum += m.mood_rating;
    weekMap[wk].energy_sum += m.energy_rating ?? 0;
    weekMap[wk].count++;
  }

  const weekly = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, d]) => ({
      week,
      avg_mood: Math.round((d.mood_sum / d.count) * 10) / 10,
      avg_energy: Math.round((d.energy_sum / d.count) * 10) / 10,
      responses: d.count,
    }));

  // Score: weighted combo of mood + energy (0–100)
  const wellnessScore = weekly.length > 0
    ? Math.round(
        weekly.slice(-4).reduce((s, w) => s + (w.avg_mood * 5 + w.avg_energy * 5), 0) /
        (weekly.slice(-4).length * 2)
      )
    : null;

  // 4-week change
  let trendChange: number | null = null;
  if (weekly.length >= 4) {
    const prev4Avg = weekly.slice(-8, -4).reduce((s, w) => s + w.avg_mood, 0) / 4;
    const curr4Avg = weekly.slice(-4).reduce((s, w) => s + w.avg_mood, 0) / 4;
    trendChange = Math.round((curr4Avg - prev4Avg) * 10) / 10;
  }

  // Participation rate: members who logged mood at least once in the last 4 weeks
  const recentSince = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: recentMoods } = await supabase
    .from('mood_logs').select('user_id').in('user_id', userIds).gte('date', recentSince);
  const participatingUsers = new Set((recentMoods ?? []).map((m) => m.user_id)).size;
  const participationRate = Math.round((participatingUsers / userIds.length) * 100);

  return apiOk({
    period_weeks: weeks,
    since,
    total_members: userIds.length,
    wellness_score: wellnessScore,
    trend_change_4w: trendChange,
    participation_rate_pct: participationRate,
    weekly_trends: weekly,
  });
}
