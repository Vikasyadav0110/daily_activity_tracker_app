'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Program {
  id: string;
  program_name: string;
  program_desc: string | null;
  category: string;
  duration_days: number;
  price: number;
  icon_url: string | null;
  cover_image_url: string | null;
  rating: number;
  review_count: number;
  sales_count: number;
  featured: boolean;
}

interface Props {
  programs: Program[];
  enrolledIds: Set<string>;
  userId: string;
}

const CATEGORIES = ['All', 'fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  fitness: '🏋️', study: '📚', wellness: '💚', spiritual: '🙏', productivity: '⚡', nutrition: '🥗',
};
const SORTS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'sales', label: 'Best Selling' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
] as const;

function ProgramCard({ program, enrolled, onEnroll, enrolling }: {
  program: Program;
  enrolled: boolean;
  onEnroll: (id: string) => void;
  enrolling: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="h-28 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
        {program.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={program.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{CATEGORY_ICONS[program.category] ?? '📦'}</span>
        )}
        {program.featured && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>
      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-1">
          <span className="text-lg">{program.icon_url ?? CATEGORY_ICONS[program.category] ?? '📦'}</span>
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{program.program_name}</p>
        </div>
        {program.program_desc && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 flex-1">{program.program_desc}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>⏱ {program.duration_days}d</span>
          <span>⭐ {program.rating > 0 ? program.rating.toFixed(1) : '—'}</span>
          <span>👤 {program.sales_count}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {program.price === 0 ? 'Free' : `₹${program.price.toLocaleString('en-IN')}`}
          </span>
          <button
            onClick={() => onEnroll(program.id)}
            disabled={enrolled || enrolling}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              enrolled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
            }`}
          >
            {enrolled ? '✓ Enrolled' : enrolling ? 'Enrolling…' : program.price === 0 ? 'Enroll Free' : 'Buy & Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceBrowse({ programs, enrolledIds, userId }: Props) {
  const supabase = createClient();
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<string>('rating');
  const [q, setQ] = useState('');
  const [enrolled, setEnrolled] = useState(new Set(enrolledIds));
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'enrolled'>('browse');

  const filtered = useMemo(() => {
    let list = programs;
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (q.trim()) list = list.filter((p) => p.program_name.toLowerCase().includes(q.toLowerCase()));
    switch (sort) {
      case 'sales':      list = [...list].sort((a, b) => b.sales_count - a.sales_count); break;
      case 'price_asc':  list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price_desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'newest':     break;
      default:           list = [...list].sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [programs, category, sort, q]);

  const enrolledPrograms = programs.filter((p) => enrolled.has(p.id));

  async function handleEnroll(programId: string) {
    setEnrolling(programId);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const res = await fetch(`/api/v1/marketplace/programs/${programId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { data?: unknown; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Enrollment failed');
      setEnrolled((prev) => new Set([...prev, programId]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEnrolling(null);
    }
  }

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Discover habit programs from expert creators. Enroll to auto-add activities to your tracker.
          </p>
        </div>
        <a href="/dashboard/marketplace/creator" className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700">
          🎨 Sell a Program
        </a>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex justify-between">
          {error} <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(['browse', 'enrolled'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === t ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
            {t === 'enrolled' ? `My Programs (${enrolled.size})` : 'Browse'}
          </button>
        ))}
      </div>

      {activeTab === 'enrolled' && (
        <div>
          {enrolledPrograms.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">No enrolled programs yet. Browse and enroll below!</p>
              <button onClick={() => setActiveTab('browse')} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Browse programs →</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledPrograms.map((p) => (
                <ProgramCard key={p.id} program={p} enrolled={true} onEnroll={handleEnroll} enrolling={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs…"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {c === 'All' ? 'All' : `${CATEGORY_ICONS[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
              </button>
            ))}
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">⭐ Featured</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProgramCard key={p.id} program={p} enrolled={enrolled.has(p.id)} onEnroll={handleEnroll} enrolling={enrolling === p.id} />
                ))}
              </div>
            </div>
          )}

          {/* All programs */}
          {rest.length > 0 && (
            <div>
              {featured.length > 0 && <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">All Programs</h2>}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <ProgramCard key={p.id} program={p} enrolled={enrolled.has(p.id)} onEnroll={handleEnroll} enrolling={enrolling === p.id} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">No programs found. Try a different filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
