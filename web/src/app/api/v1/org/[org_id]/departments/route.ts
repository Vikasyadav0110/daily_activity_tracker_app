import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

async function requireOrgMember(userId: string, orgId: string) {
  const { data: org } = await supabase
    .from('organizations').select('id, owner_id').eq('id', orgId).maybeSingle();
  if (!org) return null;
  if (org.owner_id === userId) return org;
  const { data: m } = await supabase
    .from('org_members')
    .select('role').eq('org_id', orgId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (m) return org;
  return null;
}

// GET /api/v1/org/:org_id/departments — tree of departments
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  if (!await requireOrgMember(auth.userId, org_id)) return apiError('Forbidden', 403);

  const { data, error } = await supabase
    .from('org_departments')
    .select('id, name, parent_id, manager_id, created_at')
    .eq('org_id', org_id)
    .order('name');
  if (error) return apiError(error.message, 500);

  // Build tree
  type Dept = { id: string; name: string; parent_id: string | null; manager_id: string | null; created_at: string; children?: Dept[] };
  const map = new Map<string, Dept>();
  for (const d of (data ?? []) as Dept[]) { d.children = []; map.set(d.id, d); }
  const roots: Dept[] = [];
  for (const d of map.values()) {
    if (d.parent_id && map.has(d.parent_id)) map.get(d.parent_id)!.children!.push(d);
    else roots.push(d);
  }

  return apiOk(roots, { count: data?.length ?? 0 });
}

// POST /api/v1/org/:org_id/departments
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const org = await requireOrgMember(auth.userId, org_id);
  if (!org) return apiError('Forbidden', 403);

  // Require admin/manager
  const { data: m } = await supabase
    .from('org_members').select('role').eq('org_id', org_id).eq('user_id', auth.userId).maybeSingle();
  const { data: o } = await supabase.from('organizations').select('owner_id').eq('id', org_id).maybeSingle();
  if (o?.owner_id !== auth.userId && m?.role !== 'admin' && m?.role !== 'manager') {
    return apiError('Forbidden', 403);
  }

  const body = await req.json() as { name?: string; parent_id?: string; manager_id?: string };
  if (!body.name?.trim()) return apiError('name is required', 400);

  const { data, error } = await supabase
    .from('org_departments')
    .insert({
      org_id,
      name: body.name.trim(),
      parent_id: body.parent_id ?? null,
      manager_id: body.manager_id ?? null,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'department.created',
    resource_type: 'department',
    resource_id: data.id,
    metadata: { name: data.name },
  });

  return apiOk(data, undefined, 201);
}

// DELETE /api/v1/org/:org_id/departments?department_id=xxx
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const deptId = new URL(req.url).searchParams.get('department_id');
  if (!deptId) return apiError('department_id query param required', 400);

  const { data: o } = await supabase.from('organizations').select('owner_id').eq('id', org_id).maybeSingle();
  if (!o) return apiError('Organization not found', 404);
  const { data: m } = await supabase
    .from('org_members').select('role').eq('org_id', org_id).eq('user_id', auth.userId).maybeSingle();
  if (o.owner_id !== auth.userId && m?.role !== 'admin') return apiError('Forbidden', 403);

  const { error } = await supabase
    .from('org_departments').delete().eq('id', deptId).eq('org_id', org_id);
  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id, actor_user_id: auth.userId,
    action: 'department.deleted', resource_type: 'department', resource_id: deptId, metadata: {},
  });

  return apiOk({ deleted: true });
}
