'use client';

import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const REGION_LABELS: Record<string, string> = {
  IN: '🇮🇳 India', US: '🇺🇸 United States', GB: '🇬🇧 United Kingdom',
  SG: '🇸🇬 Singapore', AU: '🇦🇺 Australia', DE: '🇩🇪 Germany',
  FR: '🇫🇷 France', JP: '🇯🇵 Japan',
};

const LOCALE_LABELS: Record<string, string> = {
  en: 'English', hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', bn: 'বাংলা',
  es: 'Español', pt: 'Português', zh: '中文', ko: '한국어', ja: '日本語', de: 'Deutsch',
};

const PLAN_COLORS: Record<string, string> = {
  free: '#9CA3AF',
  pro_monthly: '#F97316',
  pro_annual: '#EA580C',
  lifetime_pro: '#DC2626',
  premium_plus_monthly: '#7C3AED',
  premium_plus_annual: '#6D28D9',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'Pro Monthly',
  pro_annual: 'Pro Annual',
  lifetime_pro: 'Lifetime Pro',
  premium_plus_monthly: 'PP+ Monthly',
  premium_plus_annual: 'PP+ Annual',
};

type RegionRow = { region_code: string };
type PlanRow = { plan: string; status: string };
type SignupRow = { created_at: string };
type ConversionRow = { plan: string; created_at: string };
type LocaleRow = { locale: string };

interface Props {
  regionBreakdown: RegionRow[];
  planBreakdown: PlanRow[];
  recentSignups: SignupRow[];
  conversionData: ConversionRow[];
  localeBreakdown: LocaleRow[];
}

function countBy<T>(arr: T[], key: (item: T) => string): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const item of arr) {
    const k = key(item);
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function signupsByDay(signups: SignupRow[]): { date: string; signups: number }[] {
  const map: Record<string, number> = {};
  for (const s of signups) {
    const d = s.created_at.slice(0, 10);
    map[d] = (map[d] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, signups]) => ({ date, signups }));
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function GrowthDashboard({ regionBreakdown, planBreakdown, recentSignups, conversionData, localeBreakdown }: Props) {
  const totalUsers = regionBreakdown.length;
  const paidUsers = planBreakdown.filter((p) => p.plan !== 'free' && p.status === 'active').length;
  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';
  const newSignups30d = recentSignups.length;

  const regionData = countBy(regionBreakdown, (r) => REGION_LABELS[r.region_code] ?? r.region_code);
  const planData = countBy(planBreakdown.filter((p) => p.plan !== 'free'), (p) => PLAN_LABELS[p.plan] ?? p.plan);
  const localeData = countBy(localeBreakdown, (l) => LOCALE_LABELS[l.locale] ?? l.locale).slice(0, 8);
  const signupTrend = signupsByDay(recentSignups);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Growth Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time platform metrics across all regions and plans.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} sub="all time" />
        <StatCard label="Paid Users (active)" value={paidUsers.toLocaleString()} sub="Pro + Premium+" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} sub="free → paid" />
        <StatCard label="New Signups (30d)" value={newSignups30d.toLocaleString()} sub="last 30 days" />
      </div>

      {/* Signup trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-bold text-base mb-4">Daily Signups — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={signupTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="signups" stroke="#2563EB" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Region breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-bold text-base mb-4">Users by Region</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-bold text-base mb-4">Paid Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={planData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {planData.map((entry, i) => {
                  const planKey = Object.entries(PLAN_LABELS).find(([, v]) => v === entry.name)?.[0] ?? '';
                  return <Cell key={i} fill={PLAN_COLORS[planKey] ?? '#9CA3AF'} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Locale breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-bold text-base mb-4">Users by Language</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={localeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Paid plan table */}
      {conversionData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-bold text-base mb-4">Recent Paid Conversions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 pr-4 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {conversionData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {PLAN_LABELS[row.plan] ?? row.plan}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">{row.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
