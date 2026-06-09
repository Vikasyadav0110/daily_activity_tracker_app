'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MoodLog {
  id: string;
  date: string;
  mood_rating: number;
  energy_rating: number;
  notes?: string | null;
  created_at: string;
}
interface ActivityLog {
  log_date: string;
  status: string;
  duration_minutes?: number | null;
}
export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  activity_id: string;
  activities?: { name: string; emoji?: string } | null;
}

interface Props {
  moods: MoodLog[];
  logs: ActivityLog[];
  streaks: Streak[];
  today: string;
  thirtyDaysAgo: string;
}

const MOOD_LABELS: Record<number, string> = {
  1: '😞', 2: '😟', 3: '😐', 4: '🙂', 5: '😊',
  6: '😄', 7: '😁', 8: '🤩', 9: '🥳', 10: '🌟',
};

const ENERGY_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6'];

export function WellnessDashboard({ moods, logs, streaks, today }: Props) {
  const supabase = createClient();
  const [moodRating, setMoodRating] = useState(7);
  const [energyRating, setEnergyRating] = useState(7);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayMood = moods.find((m) => m.date === today);

  const avgMood = moods.length
    ? Math.round((moods.reduce((s, m) => s + m.mood_rating, 0) / moods.length) * 10) / 10
    : null;
  const avgEnergy = moods.length
    ? Math.round((moods.reduce((s, m) => s + (m.energy_rating ?? 0), 0) / moods.length) * 10) / 10
    : null;

  const completedDays = new Set(logs.filter((l) => l.status === 'completed').map((l) => l.log_date)).size;
  const totalDuration = logs.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);

  async function logMood() {
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not logged in'); setSaving(false); return; }

    const { error: err } = await supabase.from('mood_logs').upsert({
      user_id: session.user.id,
      date: today,
      mood_rating: moodRating,
      energy_rating: energyRating,
      notes: notes.trim() || null,
    }, { onConflict: 'user_id,date' });

    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Avg Mood (30d)',    value: avgMood !== null ? `${avgMood}/10` : '—',  icon: '😊' },
          { label: 'Avg Energy (30d)',  value: avgEnergy !== null ? `${avgEnergy}/10` : '—', icon: '⚡' },
          { label: 'Active Days',       value: String(completedDays),                      icon: '✅' },
          { label: 'Total Minutes',     value: totalDuration > 0 ? `${totalDuration}m` : '—', icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Log today's mood */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {todayMood ? '✏️ Update Today\'s Mood' : '😊 Log Today\'s Mood'}
          </h2>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mood</label>
                <span className="text-lg">{MOOD_LABELS[moodRating] ?? '😐'} {moodRating}/10</span>
              </div>
              <input
                type="range" min={1} max={10} value={moodRating}
                onChange={(e) => setMoodRating(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Low</span><span>High</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Energy</label>
                <span className="text-xs font-semibold" style={{ color: ENERGY_COLORS[Math.floor((energyRating - 1) / 2)] }}>
                  ⚡ {energyRating}/10
                </span>
              </div>
              <input
                type="range" min={1} max={10} value={energyRating}
                onChange={(e) => setEnergyRating(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="How are you feeling today?"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={logMood}
              disabled={saving}
              className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Log Mood'}
            </button>
          </div>
        </div>

        {/* Streaks */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🔥 Active Streaks</h2>
          {streaks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No active streaks yet. Log an activity to start!</p>
          ) : (
            <div className="space-y-3">
              {streaks.map((s) => {
                const pct = Math.min(100, (s.current_streak / Math.max(s.longest_streak, 1)) * 100);
                return (
                  <div key={s.activity_id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{s.activities?.emoji ?? '✅'}</span>
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {s.activities?.name ?? 'Activity'}
                      </span>
                      <span className="text-sm font-bold text-orange-500">🔥 {s.current_streak}d</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-orange-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Best: {s.longest_streak} days</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mood trend chart (text-based sparkline) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📈 Mood Trend (last 30 days)</h2>
        {moods.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No mood data yet. Start logging above!</p>
        ) : (
          <div className="space-y-3">
            {/* Bar chart */}
            <div className="flex items-end gap-1 h-24">
              {moods.slice(-28).map((m) => {
                const h = Math.round((m.mood_rating / 10) * 100);
                const isGood = m.mood_rating >= 7;
                return (
                  <div
                    key={m.id}
                    title={`${m.date}: mood ${m.mood_rating}/10`}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${h}%`,
                      backgroundColor: isGood ? '#3b82f6' : '#f97316',
                      minHeight: '4px',
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{moods[0]?.date ?? ''}</span>
              <span>Today</span>
            </div>

            {/* Recent entries */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
              {moods.slice(-5).reverse().map((m) => (
                <div key={m.id} className="flex items-start gap-3 text-sm">
                  <span className="text-base shrink-0">{MOOD_LABELS[m.mood_rating] ?? '😐'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{m.date}</span>
                      <span className="text-xs text-gray-400">mood {m.mood_rating} · energy {m.energy_rating}</span>
                    </div>
                    {m.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
