import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { ManagerAnalyticsDashboard } from '@/components/enterprise/ManagerAnalyticsDashboard';

export default async function EnterpriseAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load orgs this user admins or owns
  const { data: ownedOrgs } = await supabase
    .from('organizations')
    .select('id, name, plan, seats_count, seats_used')
    .eq('owner_id', user!.id);

  const { data: adminOrgs } = await supabase
    .from('org_members')
    .select('org_id, organizations(id, name, plan, seats_count, seats_used)')
    .eq('user_id', user!.id)
    .eq('role', 'admin')
    .eq('status', 'active');

  type OrgRow = { id: string; name: string; plan: string; seats_count: number; seats_used: number };
  const adminOrgRows = (adminOrgs ?? [])
    .map((m) => m.organizations as unknown as OrgRow | null)
    .filter(Boolean) as OrgRow[];

  const allOrgs = [...(ownedOrgs ?? []), ...adminOrgRows];
  const unique = [...new Map(allOrgs.map((o) => [o.id, o])).values()];

  return (
    <>
      <TopBar title="Manager Analytics" />
      <div className="flex-1 overflow-auto p-6">
        <ManagerAnalyticsDashboard orgs={unique} />
      </div>
    </>
  );
}
