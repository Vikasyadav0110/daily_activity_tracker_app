import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

async function requireOrgAdminOrManager(userId: string, orgId: string) {
  const { data: org } = await supabase
    .from('organizations').select('id, owner_id').eq('id', orgId).maybeSingle();
  if (!org) return null;
  if (org.owner_id === userId) return org;
  const { data: m } = await supabase
    .from('org_members')
    .select('role').eq('org_id', orgId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (m?.role === 'admin' || m?.role === 'manager') return org;
  return null;
}

// GET /api/v1/org/:org_id/members
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const org = await requireOrgAdminOrManager(auth.userId, org_id);
  if (!org) return apiError('Forbidden', 403);

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'active';
  const dept = url.searchParams.get('department_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  let query = supabase
    .from('org_members')
    .select('id, user_id, role, department_id, status, invited_email, joined_at, created_at', { count: 'exact' })
    .eq('org_id', org_id)
    .range(offset, offset + limit - 1);

  if (status !== 'all') query = query.eq('status', status);
  if (dept) query = query.eq('department_id', dept);

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: count ?? 0, limit, offset });
}

// POST /api/v1/org/:org_id/members — invite a single member
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const org = await requireOrgAdminOrManager(auth.userId, org_id);
  if (!org) return apiError('Forbidden', 403);

  const body = await req.json() as { email?: string; role?: string; department_id?: string };
  if (!body.email) return apiError('email is required', 400);
  const email = body.email.trim().toLowerCase();
  const role = body.role ?? 'member';
  if (!['admin', 'manager', 'member'].includes(role)) return apiError('Invalid role', 400);

  // Check seats
  const { data: orgData } = await supabase
    .from('organizations').select('seats_count, seats_used').eq('id', org_id).single();
  if (orgData && orgData.seats_used >= orgData.seats_count) {
    return apiError('Seat limit reached. Upgrade your plan or purchase more seats.', 402);
  }

  const token = randomBytes(32).toString('hex');
  const { data: invite, error } = await supabase
    .from('org_invites')
    .upsert({
      org_id,
      email,
      role,
      department_id: body.department_id ?? null,
      invited_by: auth.userId,
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'org_id,email' })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'member.invite',
    resource_type: 'member',
    resource_id: invite.id,
    metadata: { email, role },
  });

  return apiOk({ invite_id: invite.id, email, role, token, expires_at: invite.expires_at }, undefined, 201);
}

// DELETE /api/v1/org/:org_id/members — deprovision by user_id or email
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  const org = await requireOrgAdminOrManager(auth.userId, org_id);
  if (!org) return apiError('Forbidden', 403);

  const body = await req.json() as { user_id?: string; email?: string };
  if (!body.user_id && !body.email) return apiError('user_id or email required', 400);

  let query = supabase.from('org_members').update({
    status: 'deprovisioned',
    deprovisioned_at: new Date().toISOString(),
  }).eq('org_id', org_id);

  if (body.user_id) query = query.eq('user_id', body.user_id);
  else query = query.eq('invited_email', body.email!);

  const { error } = await query;
  if (error) return apiError(error.message, 500);

  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'member.deprovision',
    resource_type: 'member',
    metadata: { user_id: body.user_id, email: body.email },
  });

  // Decrement seats_used
  await supabase.rpc('decrement_org_seats', { p_org_id: org_id }).maybeSingle();

  return apiOk({ deprovisioned: true });
}
