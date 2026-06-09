import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { ApiKeyManager } from '@/components/api-keys/ApiKeyManager';

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, tier, rate_limit, requests_this_month, status, last_used_at, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <TopBar title="API Keys" />
      <div className="flex-1 overflow-auto p-6 max-w-3xl">
        <ApiKeyManager initialKeys={keys ?? []} />
      </div>
    </>
  );
}
