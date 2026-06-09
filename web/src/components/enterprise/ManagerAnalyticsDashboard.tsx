'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Org {
  id: string;
  name: string;
  plan: string;
  seats_count: number;
  seats_used: number;
}

interface Props {
  orgs: Org[];
}

interface AnalyticsData {
  period_days: number;
  total_members: number;
  active_members: number;
  engagement_rate: number;
  completion_rate: number;
  avg_mood: number | null;
  avg_energy: number | null;
  streak_distribution: { none: number; one_to_six: number; week: number; two_weeks: number; month_plus: number };
  daily_trend: Array<{ date: string; completion_rate: number; avg_mood: number | null }>;
  department_breakdown: Array<{ department_id: string | null; member_count: number; engagement_rate: number; completion_rate: number; avg_mood: number | null }>;
}

interface InsightsData {
  total_members: number;
  cohorts: {
    top_performers: { count: number; avg_streak: number; avg_mood: number | null };
    at_risk: { count: number; avg_streak: number; avg_mood: number | null };
    newly_active: { count: number; avg_streak: number; avg_mood: number | null };
    disengaged: { count: number; avg_streak: number; avg_mood: number | null };
  };
  at_risk_by_department: Array<{ department_id: string; at_risk_count: number; total_members: number }>;
  recommendations: string[];
}

const PERIODS = [
  { label: '7 days',  value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const REPORT_METRICS = ['engagement_rate', 'completion_rate', 'avg_mood', 'avg_energy', 'avg_streak', 'active_members'] as const;
const REPORT_GROUP_BY = ['week', 'department', 'day'] as const;

export function ManagerAnalyticsDashboard({ orgs }: Props) {
  const supabase = createClient();
  const [activeOrg, setActiveOrg] = useState<string>(orgs[0]?.id ?? '');
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'report'>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report builder state
  const [reportMetrics, setReportMetrics] = useState<string[]>(['engagement_rate', 'completion_rate', 'avg_mood']);
  const [reportGroupBy, setReportGroupBy] = useState<string>('week');
  const [reportFrom, setReportFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportRows, setReportRows] = useState<Array<Record<string, unknown>>>([]);
  const [reportRunning, setReportRunning] = useState(false);

  const fetchData = useCallback(async (orgId: string, days: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [analyticsRes, insightsRes] = await Promise.all([
        fetch(`/api/v1/org/${orgId}/analytics?days=${days}`, { headers }),
        fetch(`/api/v1/org/${orgId}/analytics/insights`, { headers }),
      ]);

      const analyticsJson = await analyticsRes.json() as { data?: AnalyticsData; error?: { message?: string } };
      const insightsJson = await insightsRes.json() as { data?: InsightsData; error?: { message?: string } };

      if (!analyticsRes.ok) throw new Error(analyticsJson.error?.message ?? 'Analytics failed');
      if (!insightsRes.ok) throw new Error(insightsJson.error?.message ?? 'Insights failed');

      setAnalytics(analyticsJson.data ?? null);
      setInsights(insightsJson.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  async function runReport() {
    if (!activeOrg || reportMetrics.length === 0) return;
    setReportRunning(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const res = await fetch(`/api/v1/org/${activeOrg}/reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: reportMetrics, group_by: reportGroupBy, from: reportFrom, to: reportTo }),
      });
      const json = await res.json() as { data?: { rows: Array<Record<string, unknown>> }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Report failed');
      setReportRows(json.data?.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setReportRunning(false);
    }
  }

  function toggleMetric(m: string) {
    setReportMetrics((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  const engPct = analytics ? Math.round(analytics.engagement_rate * 100) : 0;
  const compPct = analytics ? Math.round(analytics.completion_rate * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {orgs.length > 1 && (
          <select
            value={activeOrg}
            onChange={(e) => { setActiveOrg(e.target.value); setAnalytics(null); setInsights(null); }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === value ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => activeOrg && fetchData(activeOrg, period)}
          disabled={loading || !activeOrg}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
        >
          {loading ? 'Loading…' : 'Load Analytics'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-medium">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(['overview', 'insights', 'report'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'insights' ? 'Insights' : 'Report Builder'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Members',    value: analytics ? String(analytics.total_members) : '—',   color: 'text-gray-900 dark:text-white' },
              { label: 'Active Members',   value: analytics ? String(analytics.active_members) : '—',  color: 'text-blue-700 dark:text-blue-400' },
              { label: 'Engagement Rate',  value: analytics ? `${engPct}%` : '—',                      color: engPct >= 70 ? 'text-green-700 dark:text-green-400' : engPct >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400' },
              { label: 'Completion Rate',  value: analytics ? `${compPct}%` : '—',                     color: compPct >= 70 ? 'text-green-700 dark:text-green-400' : compPct >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Mood + Energy */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Mood & Energy</h3>
              {!analytics ? (
                <p className="text-sm text-gray-400 text-center py-8">Load data to view</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Avg Mood', value: analytics.avg_mood, max: 10, color: '#7c3aed' },
                    { label: 'Avg Energy', value: analytics.avg_energy, max: 10, color: '#2563eb' },
                  ].map(({ label, value, max, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {value !== null ? `${value} / ${max}` : 'No data'}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                        {value !== null && (
                          <div className="h-2 rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Streak distribution */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Streak Distribution</h3>
              {!analytics ? (
                <p className="text-sm text-gray-400 text-center py-8">Load data to view</p>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'No streak',      value: analytics.streak_distribution.none,        color: '#ef4444' },
                    { label: '1–6 days',       value: analytics.streak_distribution.one_to_six,  color: '#f97316' },
                    { label: '7–13 days',      value: analytics.streak_distribution.week,         color: '#eab308' },
                    { label: '14–29 days',     value: analytics.streak_distribution.two_weeks,    color: '#22c55e' },
                    { label: '30+ days 🔥',   value: analytics.streak_distribution.month_plus,   color: '#3b82f6' },
                  ].map(({ label, value, color }) => {
                    const total = analytics.total_members || 1;
                    return (
                      <div key={label} className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-gray-600 dark:text-gray-400 shrink-0">{label}</span>
                        <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                          <div className="h-full rounded-md flex items-center pl-2 text-white font-semibold transition-all" style={{ width: `${Math.max((value / total) * 100, value > 0 ? 8 : 0)}%`, backgroundColor: color, fontSize: '10px' }}>
                            {value > 0 ? value : ''}
                          </div>
                        </div>
                        <span className="w-6 text-right text-gray-500 dark:text-gray-400 shrink-0">{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily trend chart */}
          {analytics && analytics.daily_trend.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Daily Completion Rate Trend</h3>
              <div className="flex items-end gap-0.5 h-20">
                {analytics.daily_trend.slice(-60).map((d, i) => (
                  <div
                    key={i}
                    title={`${d.date}: ${Math.round(d.completion_rate * 100)}%`}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max(d.completion_rate * 100, 2)}%`,
                      backgroundColor: d.completion_rate >= 0.7 ? '#22c55e' : d.completion_rate >= 0.4 ? '#eab308' : '#ef4444',
                      minHeight: '2px',
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{analytics.daily_trend[0]?.date}</span>
                <span>Today</span>
              </div>
            </div>
          )}

          {/* Department breakdown */}
          {analytics && analytics.department_breakdown.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Department Breakdown</h3>
                <p className="text-xs text-gray-400 mt-0.5">Only departments with 5+ members shown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-2">Department</th>
                      <th className="px-4 py-2">Members</th>
                      <th className="px-4 py-2">Engagement</th>
                      <th className="px-4 py-2">Completion</th>
                      <th className="px-4 py-2">Avg Mood</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {analytics.department_breakdown.map((d) => (
                      <tr key={d.department_id ?? 'none'} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{d.department_id ?? 'Unassigned'}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{d.member_count}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-semibold ${d.engagement_rate >= 0.7 ? 'text-green-600' : d.engagement_rate >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Math.round(d.engagement_rate * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`font-semibold ${d.completion_rate >= 0.7 ? 'text-green-600' : d.completion_rate >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Math.round(d.completion_rate * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{d.avg_mood !== null ? `${d.avg_mood}/10` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {!insights ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
              <p className="text-3xl mb-2">💡</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click "Load Analytics" above to generate insights.</p>
            </div>
          ) : (
            <>
              {/* Cohort cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { key: 'top_performers', label: 'Top Performers', icon: '🏆', color: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20', valueColor: 'text-green-700 dark:text-green-400', desc: '14+ day streak, 80%+ completion' },
                  { key: 'at_risk',         label: 'At Risk',        icon: '⚠️', color: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',     valueColor: 'text-red-600 dark:text-red-400',   desc: 'Inactive 7+ days' },
                  { key: 'newly_active',    label: 'Newly Active',   icon: '🌱', color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',  valueColor: 'text-blue-700 dark:text-blue-400', desc: 'Started streak in last 3 days' },
                  { key: 'disengaged',      label: 'Disengaging',    icon: '📉', color: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20', valueColor: 'text-orange-600 dark:text-orange-400', desc: 'Inactive 3–6 days' },
                ].map(({ key, label, icon, color, valueColor, desc }) => {
                  const cohort = insights.cohorts[key as keyof typeof insights.cohorts];
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{icon}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                      </div>
                      <p className={`text-3xl font-bold ${valueColor}`}>{cohort.count}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
                      {cohort.avg_streak > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Avg streak: {cohort.avg_streak}d</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">💡 Recommended Actions</h3>
                  <ul className="space-y-2">
                    {insights.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
                        <span className="mt-0.5 text-blue-500">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* At-risk by department */}
              {insights.at_risk_by_department.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">At-Risk by Department</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {insights.at_risk_by_department.map((d) => {
                      const pct = Math.round((d.at_risk_count / d.total_members) * 100);
                      return (
                        <div key={d.department_id} className="flex items-center gap-4 px-4 py-3 text-sm">
                          <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 truncate">{d.department_id}</span>
                          <div className="w-32 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-2 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-red-600 dark:text-red-400 font-semibold w-16 text-right">
                            {d.at_risk_count} / {d.total_members} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Report Builder tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Custom Report Builder</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Metrics */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_METRICS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMetric(m)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        reportMetrics.includes(m)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group by + dates */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group by</label>
                  <div className="flex gap-2">
                    {REPORT_GROUP_BY.map((g) => (
                      <button
                        key={g}
                        onClick={() => setReportGroupBy(g)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          reportGroupBy === g
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                    <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                    <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={runReport}
                disabled={reportRunning || reportMetrics.length === 0 || !activeOrg}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                {reportRunning ? 'Running…' : 'Run Report'}
              </button>
              {reportRows.length > 0 && (
                <button
                  onClick={() => {
                    const headers = Object.keys(reportRows[0]);
                    const csv = [headers.join(','), ...reportRows.map((r) => headers.map((h) => String(r[h] ?? '')).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = `report-${reportFrom}-${reportTo}.csv`; a.click();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ↓ CSV
                </button>
              )}
            </div>
          </div>

          {/* Report results table */}
          {reportRows.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Report Results</h3>
                <span className="text-xs text-gray-400">{reportRows.length} rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      {Object.keys(reportRows[0]).map((h) => (
                        <th key={h} className="px-4 py-2 font-medium capitalize">{h.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {reportRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {v === null ? <span className="text-gray-300 dark:text-gray-600">—</span> : typeof v === 'number' && k.endsWith('_rate') ? `${Math.round((v as number) * 100)}%` : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
