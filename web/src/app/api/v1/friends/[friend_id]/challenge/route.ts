import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/v1/friends/:friend_id/challenge
 *
 * Challenge a friend to a habit streak competition.
 *
 * Body: { activity_id, duration_days, message? }
 *   activity_id  — the activity to compete on (must belong to caller)
 *   duration_days — 7 | 14 | 30
 *   message       — optional personal note
 *
 * Returns: { challenge_id, status: 'pending' }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { friend_id: string } }
) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const friendId = params.friend_id;

  // Verify accepted friendship exists
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id.eq.${auth.userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${auth.userId})`
    )
    .eq('status', 'accepted')
    .maybeSingle();

  if (!friendship) return apiError('You must be friends to issue a challenge', 403, 'NOT_FRIENDS');

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const activity_id = body.activity_id as string | undefined;
  const duration_days = (body.duration_days as number | undefined) ?? 7;
  const message = (body.message as string | undefined)?.trim() ?? null;

  if (!activity_id) return apiError('activity_id is required', 400, 'VALIDATION_ERROR');
  if (![7, 14, 30].includes(duration_days))
    return apiError('duration_days must be 7, 14, or 30', 400, 'VALIDATION_ERROR');

  // Verify activity belongs to the challenger
  const { data: activity } = await supabase
    .from('activities')
    .select('id, name')
    .eq('id', activity_id)
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (!activity) return apiError('Activity not found or does not belong to you', 404, 'NOT_FOUND');

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + duration_days * 86400 * 1000);

  const { data: challenge, error } = await supabase
    .from('challenges')
    .insert({
      challenger_id: auth.userId,
      challenged_id: friendId,
      activity_id,
      duration_days,
      message,
      status: 'pending',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select('id, status, starts_at, ends_at')
    .single();

  if (error) return apiError(error.message, 500);

  return apiOk({
    challenge_id: challenge.id,
    activity: { id: activity.id, name: activity.name },
    friend_id: friendId,
    duration_days,
    status: challenge.status,
    starts_at: challenge.starts_at,
    ends_at: challenge.ends_at,
    message,
  });
}

/**
 * GET /api/v1/friends/:friend_id/challenge
 *
 * Get all challenges between the authenticated user and a friend.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { friend_id: string } }
) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const friendId = params.friend_id;

  const { data, error } = await supabase
    .from('challenges')
    .select('id, challenger_id, challenged_id, activity_id, duration_days, status, message, starts_at, ends_at, created_at')
    .or(
      `and(challenger_id.eq.${auth.userId},challenged_id.eq.${friendId}),and(challenger_id.eq.${friendId},challenged_id.eq.${auth.userId})`
    )
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiOk(data ?? [], { count: (data ?? []).length });
}
