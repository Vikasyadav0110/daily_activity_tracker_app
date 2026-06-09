import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const VALID_EVENTS = [
  'activity.logged', 'activity.deleted',
  'mood.logged',
  'streak.achieved', 'streak.broken',
  'insight.generated',
  'challenge.accepted', 'challenge.completed',
  'friend.added',
] as const;

// GET /api/v1/webhooks — list caller's webhooks
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from('webhooks')
    .select('id, url, events, status, last_fired_at, failure_count, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiOk(data, { count: data?.length ?? 0 });
}

// POST /api/v1/webhooks — register a new webhook
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const body = await req.json() as { url?: string; events?: string[] };
  if (!body.url?.trim()) return apiError('url is required', 400);
  try { new URL(body.url); } catch { return apiError('url is not a valid URL', 400); }
  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return apiError('events array is required (at least one event)', 400);
  }
  const invalid = body.events.filter((e) => !VALID_EVENTS.includes(e as typeof VALID_EVENTS[number]));
  if (invalid.length) return apiError(`Invalid events: ${invalid.join(', ')}. Allowed: ${VALID_EVENTS.join(', ')}`, 400);

  // Max 10 webhooks per user
  const { count } = await supabase.from('webhooks').select('id', { count: 'exact', head: true }).eq('user_id', auth.userId);
  if ((count ?? 0) >= 10) return apiError('Maximum 10 webhooks per account', 409);

  const secret = `whsec_${randomBytes(32).toString('hex')}`;

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      user_id: auth.userId,
      url: body.url.trim(),
      secret,
      events: body.events,
      status: 'active',
    })
    .select('id, url, events, status, created_at')
    .single();

  if (error) return apiError(error.message, 500);

  // Return the secret once — it's not stored in plain text after this
  return apiOk({ ...data, secret }, undefined, 201);
}
