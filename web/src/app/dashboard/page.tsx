import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { TodayActivityList } from '@/components/activities/TodayActivityList';
import type { Activity, ActivityLog } from '@/lib/types';

function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = getTodayIST();

  const [activitiesResult, logsResult] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user!.id)
      .eq('log_date', today),
  ]);

  const activities = (activitiesResult.data ?? []) as Activity[];
  const logs = (logsResult.data ?? []) as ActivityLog[];

  const completedCount = logs.filter((l) => l.count > 0).length;
  const totalCount = activities.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const displayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata',
  });

  return (
    <>
      <TopBar title="Today" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Date + progress summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-sm">{displayDate}</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {completedCount}/{totalCount} activities done
          </h2>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Daily progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Activity list */}
        {activities.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-5xl mb-4">🎯</p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No activities yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Go to <strong>Activities</strong> to add your first habit.
            </p>
          </div>
        ) : (
          <TodayActivityList activities={activities} logs={logs} today={today} userId={user!.id} />
        )}
      </div>
    </>
  );
}
