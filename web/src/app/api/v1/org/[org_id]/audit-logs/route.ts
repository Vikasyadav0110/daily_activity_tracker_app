import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

// GET /api/v1/org/:org_id/audit-logs
// Query params: action, resource_type, actor_user_id, from, to, limit, offset
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  // Require admin
  const { data: o } = await supabase.from('organizations').select('owner_id').eq('id', org_id).maybeSingle();
  if (!o) return apiError('Organization not found', 404);
  if (o.owner_id !== auth.userId) {
    const { data: m } = await supabase
      .from('org_members').select('role').eq('org_id', org_id).eq('user_id', auth.userId).eq('status', 'active').maybeSingle();
    if (m?.role !== 'admin') return apiError('Forbidden', 403);
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');
  const action = url.searchParams.get('action');
  const resourceType = url.searchParams.get('resource_type');
  const actorId = url.searchParams.get('actor_user_id');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = supabase
    .from('org_audit_logs')
    .select('id, actor_user_id, action, resource_type, resource_id, metadata, ip_address, created_at', { count: 'exact' })
    .eq('org_id', org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq('action', action);
  if (resourceType) query = query.eq('resource_type', resourceType);
  if (actorId) query = query.eq('actor_user_id', actorId);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error, count } = await query;
  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: count ?? 0, limit, offset });
}
