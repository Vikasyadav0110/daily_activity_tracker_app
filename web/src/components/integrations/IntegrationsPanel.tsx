'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Integration {
  type: string;
  status: 'active' | 'inactive';
  channel?: string | null;
}

interface Props {
  initialIntegrations: Integration[];
}

const INTEGRATIONS = [
  {
    type: 'google_calendar',
    name: 'Google Calendar',
    icon: '📅',
    description: 'Sync scheduled tasks and habits to your Google Calendar.',
    authPath: '/functions/v1/google-calendar-sync/auth',
  },
  {
    type: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Get daily streak updates and AI insights in your Slack channel.',
    authPath: '/functions/v1/slack-notify/auth',
  },
  {
    type: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect 5,000+ apps via Zapier triggers when you log activities.',
    authPath: null, // Zapier uses API keys, not OAuth
  },
];

export function IntegrationsPanel({ initialIntegrations }: Props) {
  const supabase = createClient();
  const [integrations, setIntegrations] = useState<Record<string, Integration>>(
    Object.fromEntries(initialIntegrations.map((i) => [i.type, i]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(authPath: string | null, type: string) {
    if (!authPath) {
      // For Zapier — just show API key instructions
      alert('Use your API key (from the API Keys page) with Zapier\'s "Daily Activity Tracker" integration or via the REST API trigger.');
      return;
    }
    setLoading(type);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not logged in'); setLoading(null); return; }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    window.location.href = `${supabaseUrl}${authPath}`;
  }

  async function handleDisconnect(disconnectPath: string, type: string) {
    if (!confirm(`Disconnect ${type.replace('_', ' ')}?`)) return;
    setLoading(type);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}${disconnectPath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Disconnect failed');
      setIntegrations((prev) => ({ ...prev, [type]: { ...prev[type], status: 'inactive' } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  const disconnectPaths: Record<string, string> = {
    google_calendar: '/functions/v1/google-calendar-sync/disconnect',
    slack: '/functions/v1/slack-notify/disconnect',
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-medium hover:underline">✕</button>
        </div>
      )}

      {INTEGRATIONS.map((intg) => {
        const connected = integrations[intg.type]?.status === 'active';
        const isLoading = loading === intg.type;

        return (
          <div key={intg.type}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-start gap-4">
            <span className="text-3xl shrink-0">{intg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{intg.name}</h3>
                {connected && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Connected
                    {integrations[intg.type]?.channel ? ` · ${integrations[intg.type].channel}` : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{intg.description}</p>
            </div>
            <div className="shrink-0">
              {connected ? (
                <button
                  onClick={() => handleDisconnect(disconnectPaths[intg.type] ?? '', intg.type)}
                  disabled={isLoading || !disconnectPaths[intg.type]}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                  {isLoading ? 'Disconnecting…' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(intg.authPath, intg.type)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-colors">
                  {isLoading ? 'Connecting…' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Zapier Integration</p>
        <p>Use your <a href="/dashboard/api-keys" className="text-blue-600 dark:text-blue-400 hover:underline">API key</a> with Zapier triggers. Events supported: <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">activity_logged</code>, <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">mood_logged</code>, <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">streak_achieved</code>.</p>
      </div>
    </div>
  );
}
