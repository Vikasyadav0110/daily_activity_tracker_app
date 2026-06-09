import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };
const MIN_COHORT_SIZE = 5;

const ALLOWED_METRICS = ['engagement_rate', 'completion_rate', 'avg_mood', 'avg_energy', 'avg_streak', 'active_members'] as const;
const ALLOWED_GROUP_BY = ['department', 'week', 'day'] as const;

type Metric = typeof ALLOWED_METRICS[number];
type GroupBy = typeof ALLOWED_GROUP_BY[number];

interface ReportConfig {
  metrics: Metric[];
  group_by: GroupBy;
  from: string;
  to: string;
  department_ids?: string[];
  format?: 'json' | 'csv';
}

// POST /api/v1/org/:org_id/reports — run a custom report
export async function POST(req: NextRequest, ctx: Ctx) {
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

  const body = await req.json() as ReportConfig;

  // Validate
  if (!body.metrics || !Array.isArray(body.metrics) || body.metrics.length === 0) {
    return apiError('metrics array is required', 400);
  }
  const invalidMetrics = body.metrics.filter((m) => !ALLOWED_METRICS.includes(m));
  if (invalidMetrics.length > 0) {
    return apiError(`Invalid metrics: ${invalidMetrics.join(', ')}. Allowed: ${ALLOWED_METRICS.join(', ')}`, 400);
  }
  if (!body.group_by || !ALLOWED_GROUP_BY.includes(body.group_by)) {
    return apiError(`group_by must be one of: ${ALLOWED_GROUP_BY.join(', ')}`, 400);
  }
  if (!body.from || !body.to) return apiError('from and to dates are required (YYYY-MM-DD)', 400);
  if (body.from > body.to) return apiError('from must be before to', 400);

  const daysDiff = Math.floor((new Date(body.to).getTime() - new Date(body.from).getTime()) / 86400000);
  if (daysDiff > 365) return apiError('Date range cannot exceed 365 days', 400);

  // Get members (optionally filtered by department)
  let memberQuery = supabase
    .from('org_members').select('user_id, department_id')
    .eq('org_id', org_id).eq('status', 'active').not('user_id', 'is', null);
  if (body.department_ids?.length) memberQuery = memberQuery.in('department_id', body.department_ids);
  const { data: members } = await memberQuery;
  const userIds = (members ?? []).map((m) => m.user_id as string);

  if (userIds.length < MIN_COHORT_SIZE) {
    return apiError(`Report requires at least ${MIN_COHORT_SIZE} active members.`, 422);
  }

  const [logsRes, moodsRes, streaksRes] = await Promise.all([
    supabase.from('activity_logs')
      .select('user_id, log_date, status, duration_minutes')
      .in('user_id', userIds).gte('log_date', body.from).lte('log_date', body.to),
    supabase.from('mood_logs')
      .select('user_id, date, mood_rating, energy_rating')
      .in('user_id', userIds).gte('date', body.from).lte('date', body.to),
    supabase.from('streaks')
      .select('user_id, current_streak').in('user_id', userIds),
  ]);

  const logs = logsRes.data ?? [];
  const moods = moodsRes.data ?? [];
  const streaks = streaksRes.data ?? [];

  // Group data by the requested dimension
  type Bucket = {
    key: string;
    user_ids: Set<string>;
    logs: typeof logs;
    moods: typeof moods;
  };

  const buckets = new Map<string, Bucket>();

  function ensureBucket(key: string) {
    if (!buckets.has(key)) buckets.set(key, { key, user_ids: new Set(), logs: [], moods: [] });
    return buckets.get(key)!;
  }

  if (body.group_by === 'day') {
    for (const l of logs) {
      const b = ensureBucket(l.log_date);
      b.user_ids.add(l.user_id);
      b.logs.push(l);
    }
    for (const m of moods) {
      const b = ensureBucket(m.date);
      b.user_ids.add(m.user_id);
      b.moods.push(m);
    }
  } else if (body.group_by === 'week') {
    function isoWeek(d: string) {
      const dt = new Date(d);
      const day = dt.getDay() || 7;
      dt.setDate(dt.getDate() + 4 - day);
      const yr = dt.getFullYear();
      const wk = Math.ceil((((dt.getTime() - new Date(yr, 0, 1).getTime()) / 86400000) + 1) / 7);
      return `${yr}-W${String(wk).padStart(2, '0')}`;
    }
    for (const l of logs) { const b = ensureBucket(isoWeek(l.log_date)); b.user_ids.add(l.user_id); b.logs.push(l); }
    for (const m of moods) { const b = ensureBucket(isoWeek(m.date)); b.user_ids.add(m.user_id); b.moods.push(m); }
  } else {
    // group_by: department
    const deptOf = new Map(members?.map((m) => [m.user_id as string, m.department_id ?? 'unassigned']));
    for (const l of logs) { const b = ensureBucket(deptOf.get(l.user_id) ?? 'unassigned'); b.user_ids.add(l.user_id); b.logs.push(l); }
    for (const m of moods) { const b = ensureBucket(deptOf.get(m.user_id) ?? 'unassigned'); b.user_ids.add(m.user_id); b.moods.push(m); }
  }

  const streakByUser = new Map(streaks.map((s) => [s.user_id, s.current_streak ?? 0]));

  // Compute requested metrics per bucket
  const rows = [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .filter((b) => body.group_by === 'department' ? b.user_ids.size >= MIN_COHORT_SIZE : true)
    .map((b) => {
      const row: Record<string, unknown> = { [body.group_by]: b.key };
      for (const metric of body.metrics) {
        switch (metric) {
          case 'engagement_rate':
            row.engagement_rate = userIds.length > 0 ? Math.round((b.user_ids.size / userIds.length) * 100) / 100 : 0;
            break;
          case 'completion_rate':
            row.completion_rate = b.logs.length > 0 ? Math.round((b.logs.filter((l) => l.status === 'completed').length / b.logs.length) * 100) / 100 : 0;
            break;
          case 'avg_mood':
            row.avg_mood = b.moods.length > 0 ? Math.round(b.moods.reduce((s, m) => s + m.mood_rating, 0) / b.moods.length * 10) / 10 : null;
            break;
          case 'avg_energy':
            row.avg_energy = b.moods.length > 0 ? Math.round(b.moods.reduce((s, m) => s + (m.energy_rating ?? 0), 0) / b.moods.length * 10) / 10 : null;
            break;
          case 'avg_streak': {
            const uids = [...b.user_ids];
            row.avg_streak = uids.length > 0 ? Math.round(uids.reduce((s, uid) => s + (streakByUser.get(uid) ?? 0), 0) / uids.length * 10) / 10 : 0;
            break;
          }
          case 'active_members':
            row.active_members = b.user_ids.size;
            break;
        }
      }
      return row;
    });

  // Log report generation in audit log
  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: auth.userId,
    action: 'report.generated', resource_type: 'report',
    metadata: { metrics: body.metrics, group_by: body.group_by, from: body.from, to: body.to, rows: rows.length },
  });

  if (body.format === 'csv' && rows.length > 0) {
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => {
        const v = r[h] ?? '';
        return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v);
      }).join(',')),
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${org_id}-${body.from}-${body.to}.csv"`,
      },
    });
  }

  return apiOk({
    config: { metrics: body.metrics, group_by: body.group_by, from: body.from, to: body.to },
    total_members: userIds.length,
    rows,
    privacy_note: `Individual data suppressed. Groups <${MIN_COHORT_SIZE} excluded.`,
  });
}
