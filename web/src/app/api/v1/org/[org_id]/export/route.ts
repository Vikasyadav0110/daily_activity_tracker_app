import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

// GET /api/v1/org/:org_id/export?format=json|csv
// Returns member + audit log data for compliance export
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  // Require admin
  const { data: o } = await supabase.from('organizations').select('id, owner_id, name').eq('id', org_id).maybeSingle();
  if (!o) return apiError('Organization not found', 404);
  if (o.owner_id !== auth.userId) {
    const { data: m } = await supabase
      .from('org_members').select('role').eq('org_id', org_id).eq('user_id', auth.userId).eq('status', 'active').maybeSingle();
    if (m?.role !== 'admin') return apiError('Forbidden', 403);
  }

  const format = new URL(req.url).searchParams.get('format') ?? 'json';

  // Collect members
  const { data: members } = await supabase
    .from('org_members')
    .select('id, user_id, role, department_id, status, invited_email, joined_at, deprovisioned_at, created_at')
    .eq('org_id', org_id)
    .order('created_at');

  // Collect audit logs (last 90 days for export)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: auditLogs } = await supabase
    .from('org_audit_logs')
    .select('id, actor_user_id, action, resource_type, resource_id, metadata, ip_address, created_at')
    .eq('org_id', org_id)
    .gte('created_at', since)
    .order('created_at');

  // Log export action
  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'export.requested',
    resource_type: 'export',
    metadata: { format, member_count: members?.length ?? 0, audit_log_count: auditLogs?.length ?? 0 },
    ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
  });

  if (format === 'csv') {
    const membersCsv = [
      'id,user_id,role,department_id,status,invited_email,joined_at,deprovisioned_at,created_at',
      ...(members ?? []).map((m) =>
        [m.id, m.user_id ?? '', m.role, m.department_id ?? '', m.status,
         m.invited_email ?? '', m.joined_at ?? '', m.deprovisioned_at ?? '', m.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const auditCsv = [
      'id,actor_user_id,action,resource_type,resource_id,metadata,ip_address,created_at',
      ...(auditLogs ?? []).map((l) =>
        [l.id, l.actor_user_id ?? '', l.action, l.resource_type ?? '', l.resource_id ?? '',
         JSON.stringify(l.metadata ?? {}), l.ip_address ?? '', l.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const zip = `--- MEMBERS ---\n${membersCsv}\n\n--- AUDIT LOGS (last 90 days) ---\n${auditCsv}`;
    return new NextResponse(zip, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="org-export-${org_id}-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  // JSON
  const payload = {
    org_id,
    org_name: o.name,
    exported_at: new Date().toISOString(),
    exported_by: auth.userId,
    members: members ?? [],
    audit_logs_last_90_days: auditLogs ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="org-export-${org_id}-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
