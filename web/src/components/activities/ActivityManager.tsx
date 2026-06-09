'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Activity } from '@/lib/types';

const ICON_OPTIONS = ['🏃','📚','🧘','💪','🎯','💧','🥗','😴','✍️','🎸','🌿','🙏','📖','💼','🏋️'];
const COLOR_OPTIONS = ['#1565C0','#2E7D32','#6A1B9A','#BF360C','#E65100','#00838F','#AD1457','#283593'];
const FREQ_OPTIONS = ['daily', 'weekdays', 'weekends', 'weekly'];
const UNIT_OPTIONS = ['times', 'minutes', 'pages', 'km', 'glasses', 'sets', 'reps'];

interface Props {
  activities: Activity[];
  userId: string;
}

const EMPTY: Partial<Activity> = { name: '', icon: '🎯', color: '#1565C0', frequency: 'daily', target_count: 1, unit: 'times', is_active: true };

export function ActivityManager({ activities, userId }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<Partial<Activity>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function openCreate() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(a: Activity) { setForm(a); setEditing(a); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  async function handleSave() {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('activities').update({
          name: form.name,
          icon: form.icon,
          color: form.color,
          frequency: form.frequency,
          target_count: form.target_count,
          unit: form.unit,
          is_active: form.is_active,
        }).eq('id', editing.id);
      } else {
        await supabase.from('activities').insert({
          user_id: userId,
          name: form.name,
          icon: form.icon,
          color: form.color,
          frequency: form.frequency,
          target_count: form.target_count,
          unit: form.unit,
          is_active: true,
        });
      }
      closeForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(a: Activity) {
    await supabase.from('activities').update({ is_active: !a.is_active }).eq('id', a.id);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this activity and all its logs?')) return;
    setDeletingId(id);
    try {
      await supabase.from('activities').delete().eq('id', id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{activities.length} activities</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Activity
        </button>
      </div>

      {/* Activity list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <div key={a.id} className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 flex flex-col gap-3 ${a.is_active ? 'border-gray-100 dark:border-gray-800' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: a.color + '20' }}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{a.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {a.target_count} {a.unit} · {a.frequency}
                </p>
              </div>
              {!a.is_active && (
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg">paused</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(a)} className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Edit</button>
              <button onClick={() => handleToggleActive(a)} className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {a.is_active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="text-xs font-medium text-red-500 border border-red-200 dark:border-red-900 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {deletingId === a.id ? '…' : '🗑'}
              </button>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No activities yet. Click &quot;Add Activity&quot; to start.</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit Activity' : 'New Activity'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                <input
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Morning Run"
                  maxLength={60}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${form.icon === ic ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Frequency + target */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frequency</label>
                  <select
                    value={form.frequency ?? 'daily'}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={form.target_count ?? 1}
                      onChange={(e) => setForm((f) => ({ ...f, target_count: parseInt(e.target.value) || 1 }))}
                      className="w-20 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select
                      value={form.unit ?? 'times'}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      className="flex-1 px-2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name?.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
