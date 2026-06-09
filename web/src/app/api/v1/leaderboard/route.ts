import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET /api/v1/leaderboard
 *
 * Returns a ranked leaderboard of the authenticated user and their friends.
 *
 * Query:
 *   metric   — "streak" | "xp" | "activities_today"  (default: "streak")
 *   scope    — "friends" | "global"                  (default: "friends")
 *   limit    — 1–50                                  (default: 20)
 *
 * Returns: Array of {
 *   rank, user_id, display_name, avatar_url, score, is_self
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const metric = sp.get('metric') ?? 'streak';
  const scope = sp.get('scope') ?? 'friends';
  const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '20', 10), 1), 50);

  if (!['streak', 'xp', 'activities_today'].includes(metric)) {
    return apiError('metric must be streak, xp, or activities_today', 400, 'VALIDATION_ERROR');
  }

  // Build the candidate user IDs
  let userIds: string[] = [auth.userId];

  if (scope === 'friends') {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${auth.userId},friend_id.eq.${auth.userId}`)
      .eq('status', 'accepted');

    for (const f of friendships ?? []) {
      userIds.push(f.user_id === auth.userId ? f.friend_id : f.user_id);
    }
  }

  // Fetch the score for the chosen metric
  let scoreMap: Record<string, number> = {};

  if (metric === 'streak') {
    const { data } = await supabase
      .from('streaks')
      .select('user_id, current_streak_days')
      .in('user_id', scope === 'global' ? [] : userIds); // global: fetched below

    for (const r of data ?? []) {
      scoreMap[r.user_id] = Math.max(scoreMap[r.user_id] ?? 0, r.current_streak_days);
    }

    if (scope === 'global') {
      // Top 50 by streak globally
      const { data: top } = await supabase
        .from('streaks')
        .select('user_id, current_streak_days')
        .order('current_streak_days', { ascending: false })
        .limit(limit);
      userIds = (top ?? []).map((r) => r.user_id);
      for (const r of top ?? []) scoreMap[r.user_id] = r.current_streak_days;
    }
  } else if (metric === 'xp') {
    const query = supabase
      .from('user_xp')
      .select('user_id, total_xp');
    const { data } = scope === 'global'
      ? await query.order('total_xp', { ascending: false }).limit(limit)
      : await query.in('user_id', userIds);

    if (scope === 'global') userIds = (data ?? []).map((r: { user_id: string }) => r.user_id);
    for (const r of data ?? []) scoreMap[r.user_id] = r.total_xp;
  } else if (metric === 'activities_today') {
    const today = new Date().toISOString().split('T')[0];
    const query = supabase
      .from('activity_logs')
      .select('user_id')
      .eq('log_date', today)
      .eq('status', 'completed');
    const { data } = scope === 'friends'
      ? await query.in('user_id', userIds)
      : await query;

    for (const r of data ?? []) {
      scoreMap[r.user_id] = (scoreMap[r.user_id] ?? 0) + 1;
    }
    if (scope === 'global') userIds = Object.keys(scoreMap);
  }

  // Fetch display profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
  }

  // Build and sort leaderboard
  const entries = userIds.map((uid) => ({
    user_id: uid,
    display_name: profileMap[uid]?.display_name ?? 'Unknown',
    avatar_url: profileMap[uid]?.avatar_url ?? null,
    score: scoreMap[uid] ?? 0,
    is_self: uid === auth.userId,
  }));

  entries.sort((a, b) => b.score - a.score);
  const ranked = entries.slice(0, limit).map((e, i) => ({ rank: i + 1, ...e }));

  return apiOk(ranked, { count: ranked.length, metric, scope });
}
