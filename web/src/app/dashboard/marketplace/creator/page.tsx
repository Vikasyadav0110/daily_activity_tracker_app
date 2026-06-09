import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { CreatorDashboard } from '@/components/marketplace/CreatorDashboard';

export default async function CreatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: programs } = await supabase
    .from('marketplace_programs')
    .select('id, program_name, category, status, price, rating, review_count, sales_count, created_at, duration_days, revenue_share_pct')
    .eq('creator_user_id', user!.id)
    .order('created_at', { ascending: false });

  const totalRevenue = (programs ?? [])
    .filter((p) => p.status === 'published')
    .reduce((s, p) => s + (p.price * p.sales_count * (p.revenue_share_pct / 100)), 0);

  return (
    <>
      <TopBar title="Creator Dashboard" />
      <div className="flex-1 overflow-auto p-6">
        <CreatorDashboard
          programs={(programs ?? []) as Parameters<typeof CreatorDashboard>[0]['programs']}
          totalRevenue={Math.round(totalRevenue)}
          userId={user!.id}
        />
      </div>
    </>
  );
}
