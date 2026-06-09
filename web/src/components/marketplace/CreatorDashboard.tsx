'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CreatorProgram {
  id: string;
  program_name: string;
  category: string;
  status: string;
  price: number;
  rating: number;
  review_count: number;
  sales_count: number;
  duration_days: number;
  revenue_share_pct: number;
  created_at: string;
}

interface Props {
  programs: CreatorProgram[];
  totalRevenue: number;
  userId: string;
}

const CATEGORIES = ['fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition'];
const STATUS_COLORS: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  under_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

type ActivityTemplate = { name: string; emoji: string; category: string; goal_per_day: number };

export function CreatorDashboard({ programs, totalRevenue }: Props) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localPrograms, setLocalPrograms] = useState<CreatorProgram[]>(programs);

  // New program form state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('fitness');
  const [price, setPrice] = useState('0');
  const [duration, setDuration] = useState('30');
  const [activities, setActivities] = useState<ActivityTemplate[]>([
    { name: '', emoji: '✅', category: 'fitness', goal_per_day: 1 },
  ]);

  function addActivity() {
    setActivities((prev) => [...prev, { name: '', emoji: '✅', category, goal_per_day: 1 }]);
  }
  function updateActivity(i: number, field: keyof ActivityTemplate, value: string | number) {
    setActivities((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  }
  function removeActivity(i: number) {
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submitProgram() {
    if (!name.trim()) { setError('Program name is required'); return; }
    if (activities.some((a) => !a.name.trim())) { setError('All activities must have a name'); return; }
    setSaving(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const res = await fetch('/api/v1/marketplace/programs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_name: name.trim(),
          program_desc: desc.trim() || undefined,
          category,
          activities: activities.filter((a) => a.name.trim()),
          duration_days: parseInt(duration) || 30,
          price: parseFloat(price) || 0,
        }),
      });
      const json = await res.json() as { data?: CreatorProgram; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      if (json.data) setLocalPrograms((prev) => [json.data!, ...prev]);
      setSuccess('Program created as draft! Submit for review when ready.');
      setShowForm(false);
      setName(''); setDesc(''); setPrice('0'); setDuration('30');
      setActivities([{ name: '', emoji: '✅', category: 'fitness', goal_per_day: 1 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/v1/marketplace/programs/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'under_review' }),
    });
    setLocalPrograms((prev) => prev.map((p) => p.id === id ? { ...p, status: 'under_review' } : p));
  }

  const totalSales = localPrograms.reduce((s, p) => s + p.sales_count, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creator Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and sell habit programs. Earn 70% of every sale.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700">
          + New Program
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Programs',      value: String(localPrograms.length) },
          { label: 'Total Sales',   value: String(totalSales) },
          { label: 'Creator Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex justify-between">{error}<button onClick={() => setError(null)}>✕</button></div>}
      {success && <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex justify-between">{success}<button onClick={() => setSuccess(null)}>✕</button></div>}

      {/* New program form */}
      {showForm && (
        <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">New Program</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Program Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 30-Day Morning Yoga"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="What will participants achieve?"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Duration (days)</label>
              <input type="number" min="7" max="365" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Price (₹ INR, 0 = Free)</label>
              <input type="number" min="0" max="9999" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Activities (added to user's tracker on enrollment)</label>
              <button onClick={addActivity} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={a.emoji} onChange={(e) => updateActivity(i, 'emoji', e.target.value)}
                    className="w-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-center focus:outline-none" maxLength={2} />
                  <input value={a.name} onChange={(e) => updateActivity(i, 'name', e.target.value)}
                    placeholder="Activity name" className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <input type="number" min="1" max="10" value={a.goal_per_day} onChange={(e) => updateActivity(i, 'goal_per_day', parseInt(e.target.value) || 1)}
                    className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-center text-gray-900 dark:text-white focus:outline-none" title="Goal per day" />
                  {activities.length > 1 && (
                    <button onClick={() => removeActivity(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={submitProgram} disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors">
              {saving ? 'Creating…' : 'Create as Draft'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Programs list */}
      {localPrograms.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
          <p className="text-4xl mb-3">🎨</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">No programs yet. Create your first one above!</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {localPrograms.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.program_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{p.duration_days}d · ₹{p.price} · {p.sales_count} sales · ⭐{p.rating > 0 ? p.rating.toFixed(1) : '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'draft' && (
                    <button onClick={() => submitForReview(p.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Submit for review</button>
                  )}
                  {p.status === 'published' && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +₹{Math.round(p.price * p.sales_count * (p.revenue_share_pct / 100)).toLocaleString('en-IN')} earned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue info */}
      <div className="rounded-xl border border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 p-4 text-xs text-purple-700 dark:text-purple-400">
        <p className="font-semibold mb-1">Revenue Share: 70% to you, 30% platform fee</p>
        <p>Payouts are processed monthly via bank transfer. Minimum payout: ₹500. Tax deducted at source per Indian IT regulations.</p>
      </div>
    </div>
  );
}
