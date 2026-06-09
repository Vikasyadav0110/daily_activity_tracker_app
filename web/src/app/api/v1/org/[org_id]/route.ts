import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

async function requireOrgAdmin(userId: string, orgId: string) {
  const { data: org } = await supabase
    .from('organizations').select('id, owner_id').eq('id', orgId).maybeSingle();
  if (!org) return null;
  if (org.owner_id === userId) return org;
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (member?.role === 'admin') return org;
  return null;
}

// GET /api/v1/org/:org_id
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const { data: member } = await supabase
    .from('org_members')
    .select('role, status')
    .eq('org_id', org_id).eq('user_id', auth.userId).maybeSingle();

  const { data: org } = await supabase
    .from('organizations').select('id, owner_id').eq('id', org_id).maybeSingle();

  if (!org) return apiError('Organization not found', 404);
  if (org.owner_id !== auth.userId && member?.status !== 'active') {
    return apiError('Forbidden', 403);
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, domain, plan, seats_count, seats_used, logo_url, created_at, updated_at')
    .eq('id', org_id)
    .single();

  if (error) return apiError(error.message, 500);
  return apiOk(data);
}

// PATCH /api/v1/org/:org_id
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const org = await requireOrgAdmin(auth.userId, org_id);
  if (!org) return apiError('Forbidden', 403);

  const body = await req.json() as { name?: string; domain?: string; logo_url?: string; seats_count?: number };
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.domain !== undefined) updates.domain = body.domain;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
  if (body.seats_count !== undefined) updates.seats_count = body.seats_count;

  const { data, error } = await supabase
    .from('organizations').update(updates).eq('id', org_id).select().single();
  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'org.updated',
    resource_type: 'organization',
    resource_id: org_id,
    metadata: { changes: Object.keys(updates) },
  });

  return apiOk(data);
}

// DELETE /api/v1/org/:org_id — only owner can delete
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const { data: org } = await supabase
    .from('organizations').select('owner_id').eq('id', org_id).maybeSingle();
  if (!org) return apiError('Organization not found', 404);
  if (org.owner_id !== auth.userId) return apiError('Only the owner can delete an organization', 403);

  const { error } = await supabase.from('organizations').delete().eq('id', org_id);
  if (error) return apiError(error.message, 500);
  return apiOk({ deleted: true });
}
