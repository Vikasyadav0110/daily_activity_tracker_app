import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET /api/v1/friends
 *
 * Returns the authenticated user's accepted friends list with their 7-day streak summary.
 *
 * Query: none
 *
 * Returns: Array of { friend_id, display_name, avatar_url, current_streak, activities_today }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  // Get accepted friendships where user is either requester or recipient
  const { data: friendships, error: fsErr } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${auth.userId},friend_id.eq.${auth.userId}`)
    .eq('status', 'accepted');

  if (fsErr) return apiError(fsErr.message, 500);
  if (!friendships?.length) return apiOk([], { count: 0 });

  // Collect the other user's id for each friendship
  const friendIds = friendships.map((f) =>
    f.user_id === auth.userId ? f.friend_id : f.user_id
  );

  // Get public profiles
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', friendIds);

  if (profErr) return apiError(profErr.message, 500);

  // Get streaks (highest current streak per friend)
  const { data: streaks } = await supabase
    .from('streaks')
    .select('user_id, current_streak_days')
    .in('user_id', friendIds)
    .order('current_streak_days', { ascending: false });

  // Get today's log counts per friend (privacy-safe: just count)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs } = await supabase
    .from('activity_logs')
    .select('user_id')
    .in('user_id', friendIds)
    .eq('log_date', today)
    .eq('status', 'completed');

  const streakMap: Record<string, number> = {};
  for (const s of streaks ?? []) {
    if (!streakMap[s.user_id] || s.current_streak_days > streakMap[s.user_id]) {
      streakMap[s.user_id] = s.current_streak_days;
    }
  }

  const todayCountMap: Record<string, number> = {};
  for (const l of todayLogs ?? []) {
    todayCountMap[l.user_id] = (todayCountMap[l.user_id] ?? 0) + 1;
  }

  const friends = friendIds.map((fid) => {
    const profile = profiles?.find((p) => p.user_id === fid);
    return {
      friend_id: fid,
      display_name: profile?.display_name ?? 'Unknown',
      avatar_url: profile?.avatar_url ?? null,
      current_streak: streakMap[fid] ?? 0,
      activities_today: todayCountMap[fid] ?? 0,
    };
  });

  return apiOk(friends, { count: friends.length });
}

/**
 * POST /api/v1/friends
 *
 * Send or accept a friend request.
 *
 * Body: { friend_email }  — send request to this email
 *
 * Returns: { friendship_id, status: 'pending' | 'accepted' }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const friendEmail = (body.friend_email as string | undefined)?.trim().toLowerCase();
  if (!friendEmail) return apiError('friend_email is required', 400, 'VALIDATION_ERROR');

  // Resolve email to user id via auth.users (admin API)
  const { data: { users }, error: lookupErr } = await supabase.auth.admin.listUsers();
  if (lookupErr) return apiError(lookupErr.message, 500);

  const targetUser = users.find((u) => u.email?.toLowerCase() === friendEmail);
  if (!targetUser) return apiError('No user found with that email', 404, 'USER_NOT_FOUND');
  if (targetUser.id === auth.userId) return apiError('Cannot befriend yourself', 400, 'INVALID_REQUEST');

  const friendId = targetUser.id;

  // Check if friendship already exists (either direction)
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status, user_id, friend_id')
    .or(
      `and(user_id.eq.${auth.userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${auth.userId})`
    )
    .maybeSingle();

  if (existing) {
    // If the OTHER person sent us a request → accept it
    if (existing.status === 'pending' && existing.user_id === friendId) {
      await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      return apiOk({ friendship_id: existing.id, status: 'accepted' });
    }
    return apiError(`Friendship already ${existing.status}`, 409, 'ALREADY_EXISTS');
  }

  const { data: created, error: insertErr } = await supabase
    .from('friendships')
    .insert({ user_id: auth.userId, friend_id: friendId, status: 'pending' })
    .select('id, status')
    .single();

  if (insertErr) return apiError(insertErr.message, 500);
  return apiOk({ friendship_id: created.id, status: created.status });
}

/**
 * DELETE /api/v1/friends
 *
 * Remove a friend or cancel a pending request.
 *
 * Body: { friend_id }
 */
export async function DELETE(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError('Invalid JSON body', 400); }

  const friendId = body.friend_id as string | undefined;
  if (!friendId) return apiError('friend_id is required', 400, 'VALIDATION_ERROR');

  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${auth.userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${auth.userId})`
    );

  return apiOk({ removed: true });
}
