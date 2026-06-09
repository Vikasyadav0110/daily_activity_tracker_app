import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { ActivityManager } from '@/components/activities/ActivityManager';
import type { Activity } from '@/lib/types';

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true });

  const activities = (data ?? []) as Activity[];

  return (
    <>
      <TopBar title="Activities" />
      <div className="flex-1 overflow-auto p-6">
        <ActivityManager activities={activities} userId={user!.id} />
      </div>
    </>
  );
}
