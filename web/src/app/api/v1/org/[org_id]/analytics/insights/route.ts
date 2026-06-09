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

// GET /api/v1/org/:org_id/analytics/insights
// Returns: top performer cohort summary + at-risk cohort signals (no individual IDs exposed)
// "At-risk" = no activity logged in 7+ days AND active member
// "Top performer" = streak ≥ 14 days AND completion rate ≥ 80% in last 14 days
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

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, department_id')
    .eq('org_id', org_id).eq('status', 'active').not('user_id', 'is', null);

  const userIds = (members ?? []).map((m) => m.user_id as string);
  if (userIds.length < MIN_COHORT_SIZE) {
    return apiError(`Requires at least ${MIN_COHORT_SIZE} active members.`, 422);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Streaks for all members
  const { data: streaks } = await supabase
    .from('streaks').select('user_id, current_streak, last_log_date').in('user_id', userIds);

  // Logs for last 14 days
  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select('user_id, log_date, status')
    .in('user_id', userIds)
    .gte('log_date', fourteenDaysAgo)
    .lte('log_date', today);

  // Mood logs for last 7 days
  const { data: recentMoods } = await supabase
    .from('mood_logs')
    .select('user_id, mood_rating')
    .in('user_id', userIds)
    .gte('date', sevenDaysAgo);

  const streakMap = new Map<string, { current_streak: number; last_log_date: string | null }>();
  for (const s of streaks ?? []) {
    streakMap.set(s.user_id, { current_streak: s.current_streak ?? 0, last_log_date: s.last_log_date });
  }

  // Per-user completion rate over last 14 days
  const logsByUser = new Map<string, { total: number; completed: number }>();
  for (const l of recentLogs ?? []) {
    if (!logsByUser.has(l.user_id)) logsByUser.set(l.user_id, { total: 0, completed: 0 });
    const u = logsByUser.get(l.user_id)!;
    u.total++;
    if (l.status === 'completed') u.completed++;
  }

  // Per-user recent mood
  const moodByUser = new Map<string, number[]>();
  for (const m of recentMoods ?? []) {
    if (!moodByUser.has(m.user_id)) moodByUser.set(m.user_id, []);
    moodByUser.get(m.user_id)!.push(m.mood_rating);
  }

  // Classify each user (no IDs returned — only counts and cohort stats)
  const topPerformers: string[] = [];
  const atRisk: string[] = [];
  const newlyActive: string[] = [];
  const disengaged: string[] = [];

  const usersLastLogDate = new Map<string, string>();
  for (const l of recentLogs ?? []) {
    const cur = usersLastLogDate.get(l.user_id);
    if (!cur || l.log_date > cur) usersLastLogDate.set(l.user_id, l.log_date);
  }
  // Also from streaks
  for (const [uid, s] of streakMap) {
    if (s.last_log_date && (!usersLastLogDate.has(uid) || s.last_log_date > usersLastLogDate.get(uid)!)) {
      usersLastLogDate.set(uid, s.last_log_date);
    }
  }

  for (const userId of userIds) {
    const streak = streakMap.get(userId)?.current_streak ?? 0;
    const lastLog = usersLastLogDate.get(userId) ?? null;
    const logs14d = logsByUser.get(userId);
    const completionRate14d = logs14d && logs14d.total > 0 ? logs14d.completed / logs14d.total : 0;
    const daysSinceLog = lastLog
      ? Math.floor((Date.now() - new Date(lastLog).getTime()) / 86400000)
      : 999;

    if (streak >= 14 && completionRate14d >= 0.8) {
      topPerformers.push(userId);
    } else if (daysSinceLog >= 7) {
      atRisk.push(userId);
    } else if (daysSinceLog <= 3 && streak <= 3 && streak >= 1) {
      newlyActive.push(userId);
    } else if (daysSinceLog >= 3 && daysSinceLog < 7) {
      disengaged.push(userId);
    }
  }

  // Aggregate stats for each cohort (no IDs)
  function cohortStats(uids: string[]) {
    if (uids.length === 0) return { count: 0, avg_streak: 0, avg_mood: null as number | null };
    const avgStreak = uids.reduce((s, uid) => s + (streakMap.get(uid)?.current_streak ?? 0), 0) / uids.length;
    const moodRatings = uids.flatMap((uid) => moodByUser.get(uid) ?? []);
    const avgMood = moodRatings.length > 0
      ? moodRatings.reduce((s, r) => s + r, 0) / moodRatings.length
      : null;
    return {
      count: uids.length,
      avg_streak: Math.round(avgStreak * 10) / 10,
      avg_mood: avgMood !== null ? Math.round(avgMood * 10) / 10 : null,
    };
  }

  // Department-level at-risk counts (only if dept >= MIN_COHORT_SIZE)
  const deptAtRisk: Array<{ department_id: string; at_risk_count: number; total_members: number }> = [];
  const deptMap = new Map<string, string[]>();
  for (const m of members ?? []) {
    const key = m.department_id ?? 'unassigned';
    if (!deptMap.has(key)) deptMap.set(key, []);
    deptMap.get(key)!.push(m.user_id as string);
  }
  for (const [deptId, uids] of deptMap) {
    if (uids.length < MIN_COHORT_SIZE) continue;
    const deptAtRiskCount = atRisk.filter((uid) => uids.includes(uid)).length;
    if (deptAtRiskCount > 0) {
      deptAtRisk.push({ department_id: deptId, at_risk_count: deptAtRiskCount, total_members: uids.length });
    }
  }

  // Actionable recommendations
  const recommendations: string[] = [];
  const atRiskPct = userIds.length > 0 ? (atRisk.length / userIds.length) * 100 : 0;
  if (atRiskPct > 30) recommendations.push('Over 30% of members are inactive for 7+ days. Consider a team wellness challenge to re-engage.');
  if (topPerformers.length > 0) recommendations.push(`${topPerformers.length} high-performers maintain 14+ day streaks — recognize them with a shoutout in Slack.`);
  const lowMoodDepts = deptAtRisk.filter((d) => d.at_risk_count / d.total_members > 0.4);
  if (lowMoodDepts.length > 0) recommendations.push(`${lowMoodDepts.length} department(s) have >40% at-risk members — follow up with department managers.`);
  if (recommendations.length === 0) recommendations.push('Team engagement looks healthy. Keep encouraging daily logging habits.');

  return apiOk({
    generated_at: new Date().toISOString(),
    total_members: userIds.length,
    cohorts: {
      top_performers: cohortStats(topPerformers),
      at_risk: cohortStats(atRisk),
      newly_active: cohortStats(newlyActive),
      disengaged: cohortStats(disengaged),
    },
    at_risk_by_department: deptAtRisk,
    recommendations,
    privacy_note: 'No individual user identifiers are included in this response.',
  });
}
