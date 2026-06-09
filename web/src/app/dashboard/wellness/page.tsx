import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import type { Streak } from '@/components/wellness/WellnessDashboard';
import { WellnessDashboard } from '@/components/wellness/WellnessDashboard';

function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function getNDaysAgoIST(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default async function WellnessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = getTodayIST();
  const thirtyDaysAgo = getNDaysAgoIST(30);

  const [moodRes, logsRes, streaksRes] = await Promise.all([
    supabase
      .from('mood_logs')
      .select('id, date, mood_rating, energy_rating, notes, created_at')
      .eq('user_id', user!.id)
      .gte('date', thirtyDaysAgo)
      .lte('date', today)
      .order('date', { ascending: true }),
    supabase
      .from('activity_logs')
      .select('log_date, status, duration_minutes')
      .eq('user_id', user!.id)
      .gte('log_date', thirtyDaysAgo)
      .lte('log_date', today)
      .order('log_date', { ascending: true }),
    supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_log_date, activity_id, activities(name, emoji)')
      .eq('user_id', user!.id)
      .order('current_streak', { ascending: false })
      .limit(5),
  ]);

  return (
    <>
      <TopBar title="Wellness" />
      <div className="flex-1 overflow-auto p-6">
        <WellnessDashboard
          moods={moodRes.data ?? []}
          logs={logsRes.data ?? []}
          streaks={(streaksRes.data ?? []) as unknown as Streak[]}
          today={today}
          thirtyDaysAgo={thirtyDaysAgo}
        />
      </div>
    </>
  );
}
