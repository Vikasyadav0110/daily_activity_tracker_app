import { supabase } from '@services/supabase/client';

export interface Friend {
  id: string;
  displayName: string;
  email: string;
  weekXp: number;
  level: number;
  avatarInitials: string;
}

export interface Challenge {
  id: string;
  fromUserId: string;
  fromName: string;
  activityName: string;
  targetDays: number;
  currentDays: number;
  deadline: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  isIncoming: boolean;
}

/** Look up users by email to add as friend. */
export async function searchUserByEmail(email: string, currentUserId: string): Promise<{
  id: string; displayName: string; email: string;
} | null> {
  const { data } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .neq('id', currentUserId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.email.split('@')[0],
  };
}

export async function addFriend(userId: string, friendId: string): Promise<void> {
  await supabase.from('friends').upsert(
    [
      { user_id: userId, friend_id: friendId, status: 'active' },
      { user_id: friendId, friend_id: userId, status: 'active' },
    ],
    { onConflict: 'user_id,friend_id' }
  );
}

export async function getFriendsLeaderboard(userId: string): Promise<Friend[]> {
  // Get friend IDs
  const { data: friendRows } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!friendRows || friendRows.length === 0) return [];

  const friendIds = friendRows.map((r) => r.friend_id as string);
  // Include self
  const allIds = [userId, ...friendIds];

  // Get this week's XP from leaderboards table
  const weekStart = getWeekStartISO();
  const { data: xpRows } = await supabase
    .from('leaderboards')
    .select('user_id, week_xp, level')
    .in('user_id', allIds)
    .eq('week_start', weekStart);

  // Get display info from users table
  const { data: userRows } = await supabase
    .from('users')
    .select('id, email')
    .in('id', allIds);

  const userMap = new Map((userRows ?? []).map((u) => [u.id as string, u]));
  const xpMap = new Map(
    (xpRows ?? []).map((r) => [r.user_id as string, { weekXp: r.week_xp as number, level: r.level as number }])
  );

  return allIds
    .map((id) => {
      const user = userMap.get(id);
      const xpData = xpMap.get(id) ?? { weekXp: 0, level: 0 };
      if (!user) return null;
      const name = (user.email as string).split('@')[0];
      return {
        id,
        displayName: id === userId ? 'You' : name,
        email: user.email as string,
        weekXp: xpData.weekXp,
        level: xpData.level,
        avatarInitials: name.slice(0, 2).toUpperCase(),
      };
    })
    .filter((f): f is Friend => f !== null)
    .sort((a, b) => b.weekXp - a.weekXp);
}

export async function upsertLeaderboard(userId: string, weekXp: number, level: number): Promise<void> {
  const weekStart = getWeekStartISO();
  await supabase.from('leaderboards').upsert(
    { user_id: userId, week_start: weekStart, week_xp: weekXp, level },
    { onConflict: 'user_id,week_start' }
  );
}

export async function createChallenge(
  fromUserId: string,
  toUserId: string,
  activityName: string,
  targetDays: number,
  deadline: string
): Promise<void> {
  await supabase.from('challenges').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    activity_name: activityName,
    target_days: targetDays,
    current_days: 0,
    deadline,
    status: 'pending',
  });
}

export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  const { data } = await supabase
    .from('challenges')
    .select('*, from_user:from_user_id(email), to_user:to_user_id(email)')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    fromUserId: row.from_user_id as string,
    fromName: ((row.from_user as { email: string })?.email ?? '').split('@')[0],
    activityName: row.activity_name as string,
    targetDays: row.target_days as number,
    currentDays: row.current_days as number,
    deadline: row.deadline as string,
    status: row.status as Challenge['status'],
    isIncoming: row.to_user_id === userId,
  }));
}

export async function acceptChallenge(challengeId: string): Promise<void> {
  await supabase
    .from('challenges')
    .update({ status: 'active' })
    .eq('id', challengeId);
}

function getWeekStartISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
