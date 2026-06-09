'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  tier: string;
  rate_limit: number;
  requests_this_month: number;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
}

interface Props {
  initialKeys: ApiKey[];
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const TIER_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10000,
  enterprise: 100000,
};

export function ApiKeyManager({ initialKeys }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyTier, setNewKeyTier] = useState('pro');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim(), tier: newKeyTier }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create key');

      setRevealedKey(json.data.key);
      setNewKeyName('');
      setCreating(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'revoked' } : k));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Revealed key banner */}
      {revealedKey && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-300">API key created — copy it now</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">This key will not be shown again.</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-xl text-sm font-mono break-all select-all text-gray-900 dark:text-white">
                  {revealedKey}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(revealedKey); }}
                  className="shrink-0 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Copy
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setRevealedKey(null)} className="text-xs text-green-600 dark:text-green-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-3 font-medium hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create new key */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">API Keys</h2>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              + New Key
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Create API Key</h3>
            <div className="flex gap-3">
              <input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Zapier integration)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select
                value={newKeyTier}
                onChange={(e) => setNewKeyTier(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="free">Free (1K/mo)</option>
                <option value="pro">Pro (10K/mo)</option>
                <option value="enterprise">Enterprise (100K/mo)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading || !newKeyName.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors">
                {loading ? 'Creating…' : 'Create Key'}
              </button>
              <button type="button" onClick={() => setCreating(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Keys list */}
        {keys.length === 0 && !creating ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {keys.map((key) => {
              const usagePct = Math.min((key.requests_this_month / key.rate_limit) * 100, 100);
              return (
                <div key={key.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{key.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${key.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {key.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {TIER_LABELS[key.tier] ?? key.tier}
                        </span>
                      </div>
                      <code className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                        dat_{key.key_prefix}••••••••••••••••••••••••
                      </code>
                    </div>
                    {key.status === 'active' && (
                      <button onClick={() => handleRevoke(key.id)} disabled={loading}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>

                  {/* Usage bar */}
                  {key.status === 'active' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{key.requests_this_month.toLocaleString()} / {key.rate_limit.toLocaleString()} requests this month</span>
                        <span>{Math.round(usagePct)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Created {new Date(key.created_at).toLocaleDateString('en-IN')}</span>
                    {key.last_used_at && <span>Last used {new Date(key.last_used_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Docs link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 text-sm text-blue-800 dark:text-blue-300 space-y-1">
        <p className="font-semibold">API Documentation</p>
        <p className="text-blue-700 dark:text-blue-400">Use your API key in the Authorization header:</p>
        <code className="block mt-2 px-3 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded-lg font-mono text-xs break-all">
          Authorization: Bearer dat_your_api_key_here
        </code>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Base URL: <code className="font-mono">https://your-domain.com/api/v1</code>
        </p>
      </div>
    </div>
  );
}
