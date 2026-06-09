import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const TIER_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10000,
  enterprise: 100000,
};

// GET /api/v1/api-keys — list user's API keys
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, tier, rate_limit, requests_this_month, status, last_used_at, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: data.length });
}

// POST /api/v1/api-keys — create a new API key
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const name = (body.name as string | undefined)?.trim();
  const tier = (body.tier as string | undefined) ?? 'pro';

  if (!name) return apiError('name is required', 400, 'VALIDATION_ERROR');
  if (!['free', 'pro', 'enterprise'].includes(tier)) {
    return apiError('tier must be free, pro, or enterprise', 400, 'VALIDATION_ERROR');
  }

  // Check max keys per user (cap at 10)
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .eq('status', 'active');
  if ((count ?? 0) >= 10) {
    return apiError('Maximum of 10 active API keys reached', 400, 'LIMIT_REACHED');
  }

  // Generate key: dat_<32 random hex bytes>
  const rawKey = `dat_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(4, 12); // 8-char prefix after "dat_"

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: auth.userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      tier,
      rate_limit: TIER_LIMITS[tier],
      status: 'active',
    })
    .select('id, name, key_prefix, tier, rate_limit, requests_this_month, status, created_at')
    .single();

  if (error) return apiError(error.message, 500);

  // Return the raw key ONCE — never stored, only the hash is kept
  return apiOk({ ...data, key: rawKey });
}
