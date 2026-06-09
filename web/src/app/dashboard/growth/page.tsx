import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GrowthDashboard } from '@/components/growth/GrowthDashboard';

export const metadata = { title: 'Growth Analytics | Daily Activity Tracker' };

export default async function GrowthPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Aggregate stats across all users (admin-level, only show to admin)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  // Parallel data fetches
  const [
    { data: regionBreakdown },
    { data: planBreakdown },
    { data: recentSignups },
    { data: conversionData },
    { data: localeBreakdown },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('region_code')
      .not('region_code', 'is', null),
    supabase
      .from('subscriptions')
      .select('plan, status'),
    supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('plan, created_at')
      .neq('plan', 'free'),
    supabase
      .from('user_profiles')
      .select('locale')
      .not('locale', 'is', null),
  ]);

  return (
    <GrowthDashboard
      regionBreakdown={regionBreakdown ?? []}
      planBreakdown={planBreakdown ?? []}
      recentSignups={recentSignups ?? []}
      conversionData={conversionData ?? []}
      localeBreakdown={localeBreakdown ?? []}
    />
  );
}
