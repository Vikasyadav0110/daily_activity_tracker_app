import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import type { Activity, ActivityLog, MoodLog } from '@/lib/types';

function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function getNDaysAgoIST(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = getTodayIST();
  const thirtyDaysAgo = getNDaysAgoIST(30);

  const [activitiesRes, logsRes, moodRes] = await Promise.all([
    supabase.from('activities').select('*').eq('user_id', user!.id).eq('is_active', true),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('log_date', thirtyDaysAgo)
      .lte('log_date', today)
      .order('log_date', { ascending: true }),
    supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', thirtyDaysAgo)
      .lte('date', today)
      .order('date', { ascending: true }),
  ]);

  return (
    <>
      <TopBar title="Analytics" />
      <div className="flex-1 overflow-auto p-6">
        <AnalyticsDashboard
          activities={(activitiesRes.data ?? []) as Activity[]}
          logs={(logsRes.data ?? []) as ActivityLog[]}
          moods={(moodRes.data ?? []) as MoodLog[]}
          today={today}
          thirtyDaysAgo={thirtyDaysAgo}
        />
      </div>
    </>
  );
}
