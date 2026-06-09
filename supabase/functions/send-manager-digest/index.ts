import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// send-manager-digest
// Triggered via Supabase Cron (weekly, Monday 08:00 IST) or via internal HTTP call.
// Sends each org admin a weekly wellness + engagement summary email.

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.dailyactivitytracker.com';
const FROM_EMAIL = 'noreply@dailyactivitytracker.com';
const MIN_COHORT = 5;

interface OrgDigestData {
  orgName: string;
  orgId: string;
  totalMembers: number;
  activeMembers: number;
  engagementRate: number;
  completionRate: number;
  avgMood: number | null;
  atRiskCount: number;
  topPerformerCount: number;
  recommendations: string[];
}

async function computeDigest(orgId: string): Promise<OrgDigestData | null> {
  const { data: org } = await supabase
    .from('organizations').select('name').eq('id', orgId).maybeSingle();
  if (!org) return null;

  const { data: members } = await supabase
    .from('org_members').select('user_id').eq('org_id', orgId).eq('status', 'active').not('user_id', 'is', null);
  const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (userIds.length < MIN_COHORT) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [logsRes, moodsRes, streaksRes] = await Promise.all([
    supabase.from('activity_logs').select('user_id, status').in('user_id', userIds).gte('log_date', since).lte('log_date', today),
    supabase.from('mood_logs').select('user_id, mood_rating').in('user_id', userIds).gte('date', since),
    supabase.from('streaks').select('user_id, current_streak, last_log_date').in('user_id', userIds),
  ]);

  const logs = logsRes.data ?? [];
  const moods = moodsRes.data ?? [];
  const streaks = streaksRes.data ?? [];

  const activeUserIds = new Set(logs.map((l: { user_id: string }) => l.user_id));
  const completedLogs = logs.filter((l: { status: string }) => l.status === 'completed').length;
  const engagementRate = Math.round((activeUserIds.size / userIds.length) * 100);
  const completionRate = logs.length > 0 ? Math.round((completedLogs / logs.length) * 100) : 0;
  const avgMood = moods.length > 0
    ? Math.round(moods.reduce((s: number, m: { mood_rating: number }) => s + m.mood_rating, 0) / moods.length * 10) / 10
    : null;

  // At-risk: last_log_date > 7 days ago
  const sevenDaysAgoTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const atRiskCount = streaks.filter((s: { last_log_date: string | null }) => {
    if (!s.last_log_date) return true;
    return new Date(s.last_log_date).getTime() < sevenDaysAgoTs;
  }).length;

  // Top performers: streak >= 14
  const topPerformerCount = streaks.filter((s: { current_streak: number }) => s.current_streak >= 14).length;

  const recommendations: string[] = [];
  if (engagementRate < 60) recommendations.push('Engagement dropped below 60% — consider a weekly team challenge.');
  if (atRiskCount > userIds.length * 0.2) recommendations.push(`${atRiskCount} members inactive 7+ days — reach out via Slack or team leads.`);
  if (topPerformerCount > 0) recommendations.push(`${topPerformerCount} member(s) on 14+ day streaks — celebrate them in your next all-hands.`);
  if (avgMood !== null && avgMood < 6) recommendations.push('Team mood score below 6/10 — consider a wellness check-in this week.');

  return {
    orgName: org.name,
    orgId,
    totalMembers: userIds.length,
    activeMembers: activeUserIds.size,
    engagementRate,
    completionRate,
    avgMood,
    atRiskCount,
    topPerformerCount,
    recommendations,
  };
}

function buildEmailHtml(d: OrgDigestData, adminName: string): string {
  const moodDisplay = d.avgMood !== null ? `${d.avgMood}/10` : 'No data';
  const recItems = d.recommendations.map((r) => `<li style="margin:6px 0;color:#374151;">${r}</li>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:28px 32px;">
      <div style="font-size:24px;margin-bottom:4px;">🎯</div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Weekly Team Wellness Digest</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">${d.orgName} · Week of ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#6b7280;font-size:14px;margin-top:0;">Hi ${adminName},</p>
      <p style="color:#374151;font-size:14px;">Here's your anonymized team wellness summary for the past 7 days.</p>

      <!-- Stats grid -->
      <table style="width:100%;border-collapse:separate;border-spacing:8px;margin:20px 0;">
        <tr>
          ${[
            { label: 'Active Members', value: `${d.activeMembers} / ${d.totalMembers}`, color: '#dbeafe', accent: '#1d4ed8' },
            { label: 'Engagement Rate', value: `${d.engagementRate}%`, color: '#dcfce7', accent: '#16a34a' },
            { label: 'Completion Rate', value: `${d.completionRate}%`, color: '#fef9c3', accent: '#ca8a04' },
            { label: 'Avg Team Mood', value: moodDisplay, color: '#f3e8ff', accent: '#7c3aed' },
          ].map((stat) => `
          <td style="width:25%;background:${stat.color};border-radius:10px;padding:12px;text-align:center;vertical-align:top;">
            <div style="font-size:18px;font-weight:700;color:${stat.accent};">${stat.value}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${stat.label}</div>
          </td>`).join('')}
        </tr>
      </table>

      <!-- Cohort pills -->
      <div style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap;">
        <span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">⚠️ ${d.atRiskCount} at-risk</span>
        <span style="background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">🔥 ${d.topPerformerCount} top performers</span>
      </div>

      ${d.recommendations.length > 0 ? `
      <!-- Recommendations -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-top:20px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#1e293b;">💡 This Week's Recommendations</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;">${recItems}</ul>
      </div>` : ''}

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/dashboard/enterprise/analytics?org=${d.orgId}"
           style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
          View Full Analytics →
        </a>
      </div>

      <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center;">
        All data is anonymized. Individual member data is never exposed to managers.<br>
        <a href="${APP_URL}/dashboard/enterprise" style="color:#6b7280;">Manage digest settings</a> ·
        <a href="${APP_URL}/unsubscribe?type=manager_digest" style="color:#6b7280;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
  return res.ok;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Verify internal caller
  const secret = req.headers.get('x-internal-secret');
  if (secret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({})) as { org_id?: string };

  // If org_id given — send digest for that org only. Otherwise send for all active orgs.
  let orgIds: string[] = [];
  if (body.org_id) {
    orgIds = [body.org_id];
  } else {
    const { data: orgs } = await supabase
      .from('organizations').select('id').eq('plan', 'enterprise').order('created_at');
    orgIds = (orgs ?? []).map((o: { id: string }) => o.id);
  }

  const results: Array<{ org_id: string; sent: number; skipped: string[] }> = [];

  for (const orgId of orgIds) {
    const digest = await computeDigest(orgId);
    if (!digest) { results.push({ org_id: orgId, sent: 0, skipped: ['not enough members or org not found'] }); continue; }

    // Get admins for this org
    const { data: admins } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId).eq('role', 'admin').eq('status', 'active');

    // Also include owner
    const { data: orgRow } = await supabase.from('organizations').select('owner_id').eq('id', orgId).maybeSingle();
    const adminIds = [...new Set([...(admins ?? []).map((a: { user_id: string }) => a.user_id), orgRow?.owner_id].filter(Boolean))];

    let sent = 0;
    const skipped: string[] = [];

    for (const adminId of adminIds) {
      const { data: user } = await supabase.auth.admin.getUserById(adminId as string);
      if (!user.user?.email) { skipped.push(adminId as string); continue; }

      const adminName = user.user.user_metadata?.full_name ?? user.user.email.split('@')[0];
      const html = buildEmailHtml(digest, adminName);
      const ok = await sendEmail(user.user.email, `Weekly Wellness Digest — ${digest.orgName}`, html);
      if (ok) sent++;
      else skipped.push(user.user.email);
    }

    // Log dispatch
    await supabase.from('org_audit_logs').insert({
      org_id: orgId, actor_user_id: null,
      action: 'digest.sent', resource_type: 'report',
      metadata: { sent, skipped, engagement_rate: digest.engagementRate, at_risk: digest.atRiskCount },
    });

    results.push({ org_id: orgId, sent, skipped });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
