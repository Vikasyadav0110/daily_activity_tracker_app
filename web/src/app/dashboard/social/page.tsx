import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import type { Friend, LeaderboardEntry, Challenge } from '@/components/social/SocialDashboard';
import { SocialDashboard } from '@/components/social/SocialDashboard';

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [friendsRes, leaderboardRes, challengesRes] = await Promise.all([
    // Accepted friendships
    supabase
      .from('friendships')
      .select('id, user_a_id, user_b_id, created_at, user_a:user_profiles!friendships_user_a_id_fkey(display_name, avatar_url), user_b:user_profiles!friendships_user_b_id_fkey(display_name, avatar_url)')
      .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
      .eq('status', 'accepted')
      .limit(50),

    // Global streak leaderboard (top 10)
    supabase
      .from('streaks')
      .select('user_id, current_streak, longest_streak, user_profiles(display_name, avatar_url)')
      .order('current_streak', { ascending: false })
      .limit(10),

    // Active challenges involving this user
    supabase
      .from('challenges')
      .select('id, challenger_id, challenged_id, activity_id, duration_days, status, start_date, end_date, activities(name, emoji), challenger:user_profiles!challenges_challenger_id_fkey(display_name), challenged:user_profiles!challenges_challenged_id_fkey(display_name)')
      .or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`)
      .in('status', ['pending', 'active'])
      .order('start_date', { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <TopBar title="Social" />
      <div className="flex-1 overflow-auto p-6">
        <SocialDashboard
          userId={user!.id}
          friends={(friendsRes.data ?? []) as unknown as Friend[]}
          leaderboard={(leaderboardRes.data ?? []) as unknown as LeaderboardEntry[]}
          challenges={(challengesRes.data ?? []) as unknown as Challenge[]}
        />
      </div>
    </>
  );
}
