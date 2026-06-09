import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { IntegrationsPanel } from '@/components/integrations/IntegrationsPanel';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: integrations } = await supabase
    .from('integrations')
    .select('type, status, channel')
    .eq('user_id', user!.id);

  return (
    <>
      <TopBar title="Integrations" />
      <div className="flex-1 overflow-auto p-6 max-w-3xl">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Connect your favourite tools to automatically sync activities, streaks, and AI insights.
        </p>
        <IntegrationsPanel initialIntegrations={integrations ?? []} />
      </div>
    </>
  );
}
