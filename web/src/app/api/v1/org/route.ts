import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/v1/org — list organizations the caller belongs to or owns
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      id, name, slug, domain, plan, seats_count, seats_used, logo_url, created_at,
      org_members!inner(role, status)
    `)
    .eq('org_members.user_id', auth.userId)
    .eq('org_members.status', 'active')
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);

  // Also include orgs user owns but may not have a member row for
  const { data: owned } = await supabase
    .from('organizations')
    .select('id, name, slug, domain, plan, seats_count, seats_used, logo_url, created_at')
    .eq('owner_id', auth.userId);

  const all = [...(data ?? []), ...(owned ?? [])];
  const unique = [...new Map(all.map((o) => [o.id, o])).values()];
  return apiOk(unique, { count: unique.length });
}

// POST /api/v1/org — create an organization
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const body = await req.json() as { name?: string; slug?: string; domain?: string; seats_count?: number };
  if (!body.name || !body.slug) return apiError('name and slug are required', 400);
  if (!/^[a-z0-9-]{3,40}$/.test(body.slug)) {
    return apiError('slug must be 3-40 lowercase alphanumeric characters or hyphens', 400);
  }

  const { data: existing } = await supabase
    .from('organizations').select('id').eq('slug', body.slug).maybeSingle();
  if (existing) return apiError('slug already taken', 409);

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: body.name,
      slug: body.slug,
      domain: body.domain ?? null,
      owner_id: auth.userId,
      seats_count: body.seats_count ?? 10,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  // Auto-add owner as admin member
  await supabase.from('org_members').insert({
    org_id: org.id,
    user_id: auth.userId,
    role: 'admin',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  return apiOk(org, undefined, 201);
}
