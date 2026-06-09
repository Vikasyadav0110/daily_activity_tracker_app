'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Activity, ActivityLog, MoodLog } from '@/lib/types';

interface Props {
  activities: Activity[];
  logs: ActivityLog[];
  moods: MoodLog[];
  today: string;
  thirtyDaysAgo: string;
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    dates.push(cur.toLocaleDateString('en-CA'));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function shortDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function AnalyticsDashboard({ activities, logs, moods, today, thirtyDaysAgo }: Props) {
  const dates = useMemo(() => dateRange(thirtyDaysAgo, today), [thirtyDaysAgo, today]);

  // Daily completion % over last 30 days
  const completionData = useMemo(() => {
    const logsByDate = new Map<string, Set<number>>();
    for (const log of logs) {
      if (log.count > 0) {
        if (!logsByDate.has(log.log_date)) logsByDate.set(log.log_date, new Set());
        logsByDate.get(log.log_date)!.add(log.activity_id);
      }
    }
    return dates.map((d) => ({
      date: shortDate(d),
      pct: activities.length > 0 ? Math.round(((logsByDate.get(d)?.size ?? 0) / activities.length) * 100) : 0,
    }));
  }, [dates, logs, activities]);

  // Per-activity completion count (last 30 days)
  const activityCompletions = useMemo(() => {
    const counts = new Map<number, number>();
    for (const log of logs) {
      if (log.count > 0) counts.set(log.activity_id, (counts.get(log.activity_id) ?? 0) + 1);
    }
    return activities
      .map((a) => ({ name: `${a.icon} ${a.name}`, count: counts.get(a.id) ?? 0, color: a.color }))
      .sort((a, b) => b.count - a.count);
  }, [activities, logs]);

  // Mood trend
  const moodData = useMemo(() =>
    moods.map((m) => ({ date: shortDate(m.date), mood: m.mood_rating, energy: m.energy_level })),
    [moods]
  );

  // Summary stats
  const totalLogged = useMemo(() => logs.filter((l) => l.count > 0).length, [logs]);
  const bestStreak = useMemo(() => {
    let max = 0, cur = 0;
    for (const d of dates) {
      const done = logs.some((l) => l.log_date === d && l.count > 0);
      cur = done ? cur + 1 : 0;
      max = Math.max(max, cur);
    }
    return max;
  }, [dates, logs]);
  const avgCompletion = useMemo(() => {
    if (completionData.length === 0) return 0;
    return Math.round(completionData.reduce((s, d) => s + d.pct, 0) / completionData.length);
  }, [completionData]);
  const avgMood = useMemo(() => {
    if (moods.length === 0) return null;
    return (moods.reduce((s, m) => s + m.mood_rating, 0) / moods.length).toFixed(1);
  }, [moods]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs (30d)', value: totalLogged, icon: '📝' },
          { label: 'Avg Completion', value: `${avgCompletion}%`, icon: '🎯' },
          { label: 'Best Streak', value: `${bestStreak}d`, icon: '🔥' },
          { label: 'Avg Mood', value: avgMood ? `${avgMood}/5` : '—', icon: '💚' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily completion trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Completion % (30 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={completionData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
              interval={Math.floor(completionData.length / 6)} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Completion']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="pct" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-activity bar + mood chart side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Per-activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Activities (30d)</h3>
          {activityCompletions.length === 0 ? (
            <p className="text-gray-400 text-sm">No logs yet.</p>
          ) : (
            <div className="space-y-3">
              {activityCompletions.slice(0, 6).map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate text-gray-700 dark:text-gray-300">{a.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (a.count / 30) * 100)}%`,
                        backgroundColor: a.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{a.count}d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood trend */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Mood & Energy (30d)</h3>
          {moodData.length === 0 ? (
            <p className="text-gray-400 text-sm">No mood logs yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
                  interval={Math.floor(moodData.length / 4)} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="mood" stroke="#10B981" strokeWidth={2} dot={false} name="Mood" />
                <Line type="monotone" dataKey="energy" stroke="#6366F1" strokeWidth={2} dot={false} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
