import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { MarketplaceBrowse } from '@/components/marketplace/MarketplaceBrowse';

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [programsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('marketplace_programs')
      .select('id, program_name, program_desc, category, duration_days, price, icon_url, cover_image_url, rating, review_count, sales_count, featured')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(50),
    supabase
      .from('program_enrollments')
      .select('program_id, status, progress_pct')
      .eq('user_id', user!.id),
  ]);

  const enrolledIds = new Set(
    (enrollmentsRes.data ?? []).filter((e) => e.status === 'active').map((e) => e.program_id)
  );

  return (
    <>
      <TopBar title="Marketplace" />
      <div className="flex-1 overflow-auto p-6">
        <MarketplaceBrowse
          programs={(programsRes.data ?? []) as Parameters<typeof MarketplaceBrowse>[0]['programs']}
          enrolledIds={enrolledIds}
          userId={user!.id}
        />
      </div>
    </>
  );
}
