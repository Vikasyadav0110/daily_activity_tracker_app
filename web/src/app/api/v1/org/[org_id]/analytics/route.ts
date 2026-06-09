import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

// Privacy gate: never expose breakdowns for groups smaller than this
const MIN_COHORT_SIZE = 5;

async function requireOrgAdminOrManager(userId: string, orgId: string) {
  const { data: o } = await supabase
    .from('organizations').select('id, owner_id').eq('id', orgId).maybeSingle();
  if (!o) return null;
  if (o.owner_id === userId) return o;
  const { data: m } = await supabase
    .from('org_members')
    .select('role').eq('org_id', orgId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  return (m?.role === 'admin' || m?.role === 'manager') ? o : null;
}

// GET /api/v1/org/:org_id/analytics
// Query params: days (7|14|30|90, default 30), department_id (optional)
// Returns: engagement, activity completion rates, streak distribution — all anonymized
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgAdminOrManager(auth.userId, org_id)) return apiError('Forbidden', 403);

  const url = new URL(req.url);
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '30'), 90);
  const deptId = url.searchParams.get('department_id');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Get all active members in the org (optionally filtered by department)
  let memberQuery = supabase
    .from('org_members')
    .select('user_id, department_id')
    .eq('org_id', org_id)
    .eq('status', 'active')
    .not('user_id', 'is', null);
  if (deptId) memberQuery = memberQuery.eq('department_id', deptId);
  const { data: members } = await memberQuery;

  const userIds = (members ?? []).map((m) => m.user_id as string).filter(Boolean);

  if (userIds.length < MIN_COHORT_SIZE) {
    return apiError(
      `Analytics require at least ${MIN_COHORT_SIZE} active members to protect individual privacy.`,
      422
    );
  }

  // Activity logs for these members over the period
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('user_id, log_date, status, duration_minutes')
    .in('user_id', userIds)
    .gte('log_date', since);

  // Mood logs
  const { data: moods } = await supabase
    .from('mood_logs')
    .select('user_id, date, mood_rating, energy_rating')
    .in('user_id', userIds)
    .gte('date', since);

  // Streaks
  const { data: streaks } = await supabase
    .from('streaks')
    .select('user_id, current_streak')
    .in('user_id', userIds);

  const totalMembers = userIds.length;
  const logList = logs ?? [];
  const moodList = moods ?? [];
  const streakList = streaks ?? [];

  // Engagement: unique active users (at least 1 log) / total members
  const activeUserIds = new Set(logList.map((l) => l.user_id));
  const engagementRate = totalMembers > 0 ? activeUserIds.size / totalMembers : 0;

  // Completion rate: completed / total logs
  const completedLogs = logList.filter((l) => l.status === 'completed').length;
  const completionRate = logList.length > 0 ? completedLogs / logList.length : 0;

  // Average mood
  const avgMood = moodList.length > 0
    ? moodList.reduce((s, m) => s + m.mood_rating, 0) / moodList.length
    : null;
  const avgEnergy = moodList.length > 0
    ? moodList.reduce((s, m) => s + (m.energy_rating ?? 0), 0) / moodList.length
    : null;

  // Streak distribution buckets (anonymized — no user IDs)
  const streakBuckets = { none: 0, one_to_six: 0, week: 0, two_weeks: 0, month_plus: 0 };
  for (const s of streakList) {
    const cs = s.current_streak ?? 0;
    if (cs === 0) streakBuckets.none++;
    else if (cs < 7) streakBuckets.one_to_six++;
    else if (cs < 14) streakBuckets.week++;
    else if (cs < 30) streakBuckets.two_weeks++;
    else streakBuckets.month_plus++;
  }

  // Daily trend: aggregate by date (no per-user data)
  const dailyMap: Record<string, { logs: number; completed: number; mood_sum: number; mood_count: number }> = {};
  for (const l of logList) {
    if (!dailyMap[l.log_date]) dailyMap[l.log_date] = { logs: 0, completed: 0, mood_sum: 0, mood_count: 0 };
    dailyMap[l.log_date].logs++;
    if (l.status === 'completed') dailyMap[l.log_date].completed++;
  }
  for (const m of moodList) {
    if (!dailyMap[m.date]) dailyMap[m.date] = { logs: 0, completed: 0, mood_sum: 0, mood_count: 0 };
    dailyMap[m.date].mood_sum += m.mood_rating;
    dailyMap[m.date].mood_count++;
  }
  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      completion_rate: d.logs > 0 ? Math.round((d.completed / d.logs) * 100) : 0,
      avg_mood: d.mood_count > 0 ? Math.round((d.mood_sum / d.mood_count) * 10) / 10 : null,
    }));

  // Department breakdown (only for admins, only if each dept meets MIN_COHORT_SIZE)
  let departmentBreakdown: Array<{
    department_id: string | null;
    member_count: number;
    engagement_rate: number;
    completion_rate: number;
    avg_mood: number | null;
  }> = [];

  if (!deptId) {
    const deptGroups: Record<string, string[]> = {};
    for (const m of members ?? []) {
      const key = m.department_id ?? 'none';
      if (!deptGroups[key]) deptGroups[key] = [];
      deptGroups[key].push(m.user_id as string);
    }
    for (const [dept, uids] of Object.entries(deptGroups)) {
      if (uids.length < MIN_COHORT_SIZE) continue; // privacy gate
      const deptLogs = logList.filter((l) => uids.includes(l.user_id));
      const deptMoods = moodList.filter((m) => uids.includes(m.user_id));
      const deptActive = new Set(deptLogs.map((l) => l.user_id)).size;
      const deptCompleted = deptLogs.filter((l) => l.status === 'completed').length;
      departmentBreakdown.push({
        department_id: dept === 'none' ? null : dept,
        member_count: uids.length,
        engagement_rate: Math.round((deptActive / uids.length) * 100) / 100,
        completion_rate: deptLogs.length > 0 ? Math.round((deptCompleted / deptLogs.length) * 100) / 100 : 0,
        avg_mood: deptMoods.length > 0
          ? Math.round(deptMoods.reduce((s, m) => s + m.mood_rating, 0) / deptMoods.length * 10) / 10
          : null,
      });
    }
  }

  return apiOk({
    period_days: days,
    since,
    total_members: totalMembers,
    active_members: activeUserIds.size,
    engagement_rate: Math.round(engagementRate * 100) / 100,
    completion_rate: Math.round(completionRate * 100) / 100,
    avg_mood: avgMood !== null ? Math.round(avgMood * 10) / 10 : null,
    avg_energy: avgEnergy !== null ? Math.round(avgEnergy * 10) / 10 : null,
    streak_distribution: streakBuckets,
    daily_trend: dailyTrend,
    department_breakdown: departmentBreakdown,
    privacy_note: `Individual data suppressed. Groups <${MIN_COHORT_SIZE} members excluded from department breakdown.`,
  });
}
