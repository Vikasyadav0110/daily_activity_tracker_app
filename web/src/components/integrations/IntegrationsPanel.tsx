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
    disconnectPath: '/functions/v1/google-calendar-sync/disconnect',
  },
  {
    type: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Get daily streak updates and AI insights in your Slack channel.',
    authPath: '/functions/v1/slack-notify/auth',
    disconnectPath: '/functions/v1/slack-notify/disconnect',
  },
  {
    type: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Automatically log completed activities to a Notion database.',
    authPath: '/functions/v1/notion-sync/auth',
    disconnectPath: '/functions/v1/notion-sync/disconnect',
  },
  {
    type: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect 5,000+ apps via Zapier triggers when you log activities.',
    authPath: null,
    disconnectPath: null,
  },
];

const WEBHOOK_EVENTS = [
  { value: 'activity_logged',  label: 'activity.logged' },
  { value: 'mood_logged',      label: 'mood.logged' },
  { value: 'streak_achieved',  label: 'streak.achieved' },
  { value: 'insight_generated', label: 'insight.generated' },
  { value: 'challenge_accepted', label: 'challenge.accepted' },
];

function buildSamplePayload(event: string) {
  const base = { event, timestamp: new Date().toISOString(), version: '1' };
  const payloads: Record<string, object> = {
    activity_logged:   { ...base, data: { activity_id: 'act_demo', activity_name: 'Morning Run', date: '2026-06-09', status: 'completed', duration_minutes: 30 } },
    mood_logged:       { ...base, data: { mood_id: 'mood_demo', rating: 8, energy: 7, date: '2026-06-09' } },
    streak_achieved:   { ...base, data: { streak: 7, activity_name: 'Morning Run', milestone: true } },
    insight_generated: { ...base, data: { insight_id: 'ins_demo', summary: 'Your completion rate increased 12% this week.' } },
    challenge_accepted:{ ...base, data: { challenge_id: 'ch_demo', challenger_name: 'Priya', activity_name: 'Yoga', duration_days: 7 } },
  };
  return payloads[event] ?? base;
}

interface WebhookResult {
  status: number;
  statusText: string;
  body: string;
  latencyMs: number;
}

export function IntegrationsPanel({ initialIntegrations }: Props) {
  const supabase = createClient();
  const [integrations, setIntegrations] = useState<Record<string, Integration>>(
    Object.fromEntries(initialIntegrations.map((i) => [i.type, i]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Notion DB setup
  const [notionSettingUp, setNotionSettingUp] = useState(false);
  const [notionDbUrl, setNotionDbUrl] = useState<string | null>(null);

  // Webhook tester state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState(WEBHOOK_EVENTS[0].value);
  const [webhookSending, setWebhookSending] = useState(false);
  const [webhookResult, setWebhookResult] = useState<WebhookResult | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  async function handleConnect(authPath: string | null, type: string) {
    if (!authPath) {
      alert("Use your API key (from the API Keys page) with Zapier's \"Daily Activity Tracker\" integration or via the REST API trigger.");
      return;
    }
    setLoading(type);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not logged in'); setLoading(null); return; }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    window.location.href = `${supabaseUrl}${authPath}`;
  }

  async function handleDisconnect(disconnectPath: string, type: string) {
    if (!confirm(`Disconnect ${type.replace(/_/g, ' ')}?`)) return;
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
      if (type === 'notion') setNotionDbUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  async function handleNotionSetupDB() {
    setNotionSettingUp(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/notion-sync/setup-database`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json() as { database_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Setup failed');
      setNotionDbUrl(data.database_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setNotionSettingUp(false);
    }
  }

  async function handleWebhookTest() {
    const trimmed = webhookUrl.trim();
    if (!trimmed) { setWebhookError('Enter a webhook URL first.'); return; }
    try { new URL(trimmed); } catch { setWebhookError('Invalid URL.'); return; }

    setWebhookSending(true);
    setWebhookResult(null);
    setWebhookError(null);

    const payload = buildSamplePayload(webhookEvent);
    const start = Date.now();
    try {
      const res = await fetch(trimmed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DAT-Event': webhookEvent },
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      setWebhookResult({ status: res.status, statusText: res.statusText, body, latencyMs: Date.now() - start });
    } catch (err) {
      setWebhookError(err instanceof Error ? `Request failed: ${err.message}` : 'Unknown error');
    } finally {
      setWebhookSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-medium hover:underline">✕</button>
        </div>
      )}

      {/* Integration cards */}
      {INTEGRATIONS.map((intg) => {
        const connected = integrations[intg.type]?.status === 'active';
        const isLoading = loading === intg.type;

        return (
          <div key={intg.type}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-4">
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
                {intg.authPath === null ? (
                  <span className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl">
                    API Key
                  </span>
                ) : connected ? (
                  <button
                    onClick={() => handleDisconnect(intg.disconnectPath!, intg.type)}
                    disabled={isLoading}
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

            {/* Notion: DB setup helper shown after connecting */}
            {intg.type === 'notion' && connected && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {notionDbUrl ? (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    ✅ Notion database ready —{' '}
                    <a href={notionDbUrl} target="_blank" rel="noreferrer" className="underline">
                      Open in Notion
                    </a>
                  </p>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                      Create a <strong>Daily Activity Tracker</strong> database in your workspace to start syncing logs automatically.
                    </p>
                    <button
                      onClick={handleNotionSetupDB}
                      disabled={notionSettingUp}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors">
                      {notionSettingUp ? 'Creating…' : 'Set up database'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Zapier helper */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Zapier Integration</p>
        <p>
          Use your{' '}
          <a href="/dashboard/api-keys" className="text-blue-600 dark:text-blue-400 hover:underline">API key</a>{' '}
          with Zapier triggers. Events supported:{' '}
          {WEBHOOK_EVENTS.map((e) => (
            <code key={e.value} className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded mx-0.5">
              {e.label}
            </code>
          ))}
        </p>
      </div>

      {/* Webhook tester */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🔬 Webhook Tester</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Send a sample event payload to any URL to verify your endpoint before going live.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://your-endpoint.example.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={webhookEvent}
              onChange={(e) => setWebhookEvent(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WEBHOOK_EVENTS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <button
              onClick={handleWebhookTest}
              disabled={webhookSending}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {webhookSending ? 'Sending…' : 'Send test'}
            </button>
          </div>

          {/* Payload preview */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none">
              View payload ▾
            </summary>
            <pre className="mt-2 rounded-lg bg-gray-900 p-3 text-xs text-green-400 font-mono overflow-x-auto">
              {JSON.stringify(buildSamplePayload(webhookEvent), null, 2)}
            </pre>
          </details>

          {/* Error */}
          {webhookError && (
            <p className="text-xs text-red-600 dark:text-red-400">{webhookError}</p>
          )}

          {/* Result */}
          {webhookResult && (
            <div className={`rounded-lg border px-4 py-3 text-xs font-mono ${
              webhookResult.status >= 200 && webhookResult.status < 300
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-bold ${webhookResult.status < 300 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {webhookResult.status} {webhookResult.statusText}
                </span>
                <span className="text-gray-400">{webhookResult.latencyMs}ms</span>
              </div>
              {webhookResult.body && (
                <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all line-clamp-6">
                  {webhookResult.body}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
