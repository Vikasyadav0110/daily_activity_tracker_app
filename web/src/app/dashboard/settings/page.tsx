import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', user!.id)
    .maybeSingle();

  return (
    <>
      <TopBar title="Settings" />
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <SettingsForm user={user!} subscription={sub} />
      </div>
    </>
  );
}
