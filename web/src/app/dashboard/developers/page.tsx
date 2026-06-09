'use client';

import { useState } from 'react';
import Link from 'next/link';

const ENDPOINTS = [
  { method: 'POST', path: '/auth/signup', desc: 'Create account', tag: 'Auth' },
  { method: 'POST', path: '/auth/signin', desc: 'Sign in', tag: 'Auth' },
  { method: 'POST', path: '/auth/refresh', desc: 'Refresh token', tag: 'Auth' },
  { method: 'GET',  path: '/activities', desc: 'List activities', tag: 'Activities' },
  { method: 'POST', path: '/activities', desc: 'Create activity', tag: 'Activities' },
  { method: 'GET',  path: '/activities/{id}', desc: 'Get activity', tag: 'Activities' },
  { method: 'PATCH', path: '/activities/{id}', desc: 'Update activity', tag: 'Activities' },
  { method: 'DELETE', path: '/activities/{id}', desc: 'Delete activity', tag: 'Activities' },
  { method: 'GET',  path: '/activities/{id}/logs', desc: 'Get logs', tag: 'Logs' },
  { method: 'POST', path: '/activities/{id}/logs', desc: 'Log activity', tag: 'Logs' },
  { method: 'PATCH', path: '/logs/{log_id}', desc: 'Update log', tag: 'Logs' },
  { method: 'DELETE', path: '/logs/{log_id}', desc: 'Delete log', tag: 'Logs' },
  { method: 'GET',  path: '/analytics', desc: 'Analytics summary', tag: 'Analytics' },
  { method: 'GET',  path: '/insights', desc: 'AI insights', tag: 'Insights' },
  { method: 'GET',  path: '/friends', desc: 'List friends', tag: 'Social' },
  { method: 'POST', path: '/friends', desc: 'Send friend request', tag: 'Social' },
  { method: 'DELETE', path: '/friends', desc: 'Remove friend', tag: 'Social' },
  { method: 'POST', path: '/friends/{id}/challenge', desc: 'Challenge friend', tag: 'Social' },
  { method: 'GET',  path: '/leaderboard', desc: 'Leaderboard', tag: 'Social' },
  { method: 'GET',  path: '/api-keys', desc: 'List API keys', tag: 'API Keys' },
  { method: 'POST', path: '/api-keys', desc: 'Create API key', tag: 'API Keys' },
  { method: 'DELETE', path: '/api-keys/{id}', desc: 'Revoke API key', tag: 'API Keys' },
  { method: 'GET',  path: '/coaching/sessions', desc: 'List sessions', tag: 'Coaching' },
  { method: 'POST', path: '/coaching/sessions', desc: 'Start session', tag: 'Coaching' },
  // Webhooks
  { method: 'GET',    path: '/webhooks', desc: 'List webhooks', tag: 'Webhooks' },
  { method: 'POST',   path: '/webhooks', desc: 'Register webhook', tag: 'Webhooks' },
  { method: 'PATCH',  path: '/webhooks/{id}', desc: 'Update webhook', tag: 'Webhooks' },
  { method: 'DELETE', path: '/webhooks/{id}', desc: 'Delete webhook', tag: 'Webhooks' },
  { method: 'POST',   path: '/webhooks/{id}/test', desc: 'Send test ping', tag: 'Webhooks' },
  // Marketplace
  { method: 'GET',    path: '/marketplace/programs', desc: 'Browse programs', tag: 'Marketplace' },
  { method: 'POST',   path: '/marketplace/programs', desc: 'Create program', tag: 'Marketplace' },
  { method: 'GET',    path: '/marketplace/programs/{id}', desc: 'Get program', tag: 'Marketplace' },
  { method: 'PATCH',  path: '/marketplace/programs/{id}', desc: 'Update program', tag: 'Marketplace' },
  { method: 'DELETE', path: '/marketplace/programs/{id}', desc: 'Delete program', tag: 'Marketplace' },
  { method: 'POST',   path: '/marketplace/programs/{id}/enroll', desc: 'Enroll in program', tag: 'Marketplace' },
  { method: 'DELETE', path: '/marketplace/programs/{id}/enroll', desc: 'Abandon enrollment', tag: 'Marketplace' },
  { method: 'GET',    path: '/marketplace/my-programs', desc: 'My enrolled/created programs', tag: 'Marketplace' },
  // Enterprise
  { method: 'GET',    path: '/org', desc: 'List orgs', tag: 'Enterprise' },
  { method: 'POST',   path: '/org', desc: 'Create org', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}', desc: 'Get org', tag: 'Enterprise' },
  { method: 'PATCH',  path: '/org/{id}', desc: 'Update org', tag: 'Enterprise' },
  { method: 'DELETE', path: '/org/{id}', desc: 'Delete org', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}/members', desc: 'List members', tag: 'Enterprise' },
  { method: 'POST',   path: '/org/{id}/members', desc: 'Invite member', tag: 'Enterprise' },
  { method: 'POST',   path: '/org/{id}/members/bulk-invite', desc: 'Bulk CSV invite', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}/departments', desc: 'Department tree', tag: 'Enterprise' },
  { method: 'POST',   path: '/org/{id}/departments', desc: 'Create department', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}/audit-logs', desc: 'Query audit logs', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}/export', desc: 'Export org data', tag: 'Enterprise' },
  { method: 'GET',    path: '/org/{id}/sso', desc: 'Get SSO config / SAML metadata', tag: 'Enterprise' },
  { method: 'POST',   path: '/org/{id}/sso', desc: 'Configure SAML SSO', tag: 'Enterprise' },
  { method: 'POST',   path: '/org/{id}/sso/acs', desc: 'SAML ACS (IdP callback)', tag: 'Enterprise' },
  // Manager Analytics
  { method: 'GET',  path: '/org/{id}/analytics', desc: 'Engagement analytics (min 5 members)', tag: 'Analytics' },
  { method: 'GET',  path: '/org/{id}/analytics/wellness', desc: 'Weekly wellness trends', tag: 'Analytics' },
  { method: 'GET',  path: '/org/{id}/analytics/insights', desc: 'Cohort insights (at-risk etc.)', tag: 'Analytics' },
  { method: 'POST', path: '/org/{id}/reports', desc: 'Custom analytics report', tag: 'Analytics' },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-green-100 text-green-700',
  PATCH:  'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

const TAGS = ['All', 'Auth', 'Activities', 'Logs', 'Analytics', 'Insights', 'Social', 'API Keys', 'Coaching', 'Webhooks', 'Marketplace', 'Enterprise'];

const CODE_EXAMPLES: Record<string, string> = {
  curl: `# ── Auth ──
curl -X POST https://app.dailyactivitytracker.com/api/v1/auth/signin \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}'

# ── Activities ──
# List (replace TOKEN with access_token or dat_... API key)
curl https://app.dailyactivitytracker.com/api/v1/activities \\
  -H "Authorization: Bearer TOKEN"

# Log an activity
curl -X POST https://app.dailyactivitytracker.com/api/v1/activities/ACTIVITY_ID/logs \\
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \\
  -d '{"status":"completed","duration_minutes":30}'

# ── Marketplace ──
# Browse programs (no auth needed)
curl "https://app.dailyactivitytracker.com/api/v1/marketplace/programs?category=fitness&sort=rating"

# Enroll in a free program
curl -X POST https://app.dailyactivitytracker.com/api/v1/marketplace/programs/PROGRAM_ID/enroll \\
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{}'

# ── Webhooks ──
# Register a webhook
curl -X POST https://app.dailyactivitytracker.com/api/v1/webhooks \\
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \\
  -d '{"url":"https://your.server/hooks","events":["activity.logged","streak.achieved"]}'

# Send test ping
curl -X POST https://app.dailyactivitytracker.com/api/v1/webhooks/WEBHOOK_ID/test \\
  -H "Authorization: Bearer TOKEN"

# ── Analytics ──
curl "https://app.dailyactivitytracker.com/api/v1/analytics?days=7" \\
  -H "Authorization: Bearer TOKEN"`,

  javascript: `const BASE = 'https://app.dailyactivitytracker.com/api/v1';
// Use your dat_... API key or a JWT from /auth/signin
const API_KEY = 'dat_your_key_here';
const headers = { Authorization: \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' };

// ── Log an activity ──
const activities = await fetch(\`\${BASE}/activities\`, { headers }).then(r => r.json());
await fetch(\`\${BASE}/activities/\${activities.data[0].id}/logs\`, {
  method: 'POST', headers,
  body: JSON.stringify({ status: 'completed', duration_minutes: 30 }),
});

// ── Browse Marketplace programs ──
const { data: programs } = await fetch(
  \`\${BASE}/marketplace/programs?category=wellness&sort=rating\`
).then(r => r.json());
console.log(programs.map(p => \`\${p.program_name} — \${p.price === 0 ? 'Free' : '₹' + p.price}\`));

// ── Register a webhook ──
const { data: wh } = await fetch(\`\${BASE}/webhooks\`, {
  method: 'POST', headers,
  body: JSON.stringify({
    url: 'https://your.server/hooks',
    events: ['activity.logged', 'streak.achieved', 'mood.logged'],
  }),
}).then(r => r.json());
// IMPORTANT: wh.secret is shown once — store it to verify X-DAT-Signature
console.log('Webhook secret:', wh.secret);

// ── Verify incoming webhook signature ──
import { createHmac } from 'crypto';
function verifyWebhook(rawBody, signature, secret) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}`,

  python: `import requests, hmac, hashlib

BASE = "https://app.dailyactivitytracker.com/api/v1"
API_KEY = "dat_your_key_here"  # or use JWT from /auth/signin
headers = {"Authorization": f"Bearer {API_KEY}"}

# ── Log an activity ──
activities = requests.get(f"{BASE}/activities", headers=headers).json()["data"]
act_id = activities[0]["id"]
requests.post(f"{BASE}/activities/{act_id}/logs", headers=headers, json={
    "status": "completed", "duration_minutes": 45, "notes": "Felt great!"
})

# ── Browse Marketplace programs ──
programs = requests.get(
    f"{BASE}/marketplace/programs", params={"category": "fitness", "sort": "rating"}
).json()["data"]
for p in programs[:3]:
    price = "Free" if p["price"] == 0 else f"₹{p['price']}"
    print(f"{p['program_name']} — {price} — ⭐{p['rating']}")

# ── Register a webhook ──
resp = requests.post(f"{BASE}/webhooks", headers=headers, json={
    "url": "https://your.server/hooks",
    "events": ["activity.logged", "streak.achieved"],
}).json()["data"]
WEBHOOK_SECRET = resp["secret"]  # store this! shown only once

# ── Verify incoming webhook signature ──
def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# ── Get org analytics (Enterprise) ──
analytics = requests.get(
    f"{BASE}/org/ORG_ID/analytics", headers=headers, params={"days": 30}
).json()["data"]
print(f"Engagement: {analytics['engagement_rate']:.0%}, Avg mood: {analytics['avg_mood']:.1f}/10")`,
};

export default function DevelopersPage() {
  const [activeTag, setActiveTag] = useState('All');
  const [activeExample, setActiveExample] = useState<'curl' | 'javascript' | 'python'>('curl');

  const filtered = activeTag === 'All' ? ENDPOINTS : ENDPOINTS.filter(e => e.tag === activeTag);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
          <p className="mt-1 text-sm text-gray-500">
            REST API v1 — Build integrations on top of Daily Activity Tracker
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/v1/openapi.json"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📄 OpenAPI Spec
          </a>
          <Link
            href="/dashboard/api-keys"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            🔑 Manage API Keys
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Free tier', value: '1,000 req/mo' },
          { label: 'Pro tier', value: '10,000 req/mo' },
          { label: 'Enterprise', value: '100,000 req/mo' },
          { label: 'SLA uptime', value: '99.99%' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Code examples */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 pt-4">
          <h2 className="flex-1 text-sm font-semibold text-gray-900">Quick Start</h2>
          <div className="flex gap-1 pb-3">
            {(['curl', 'javascript', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveExample(lang)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activeExample === lang
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang === 'javascript' ? 'JavaScript' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <pre className="overflow-x-auto bg-gray-900 p-4 text-xs leading-relaxed text-green-400 font-mono">
          <code>{CODE_EXAMPLES[activeExample]}</code>
        </pre>
      </div>

      {/* Authentication section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Authentication</h2>
        <p className="mt-2 text-sm text-gray-600">
          All endpoints (except <code className="rounded bg-gray-100 px-1 text-xs">/auth/signup</code> and{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">/auth/signin</code>) require a Bearer token.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-800">API Key (recommended for integrations)</p>
            <code className="mt-1 block text-xs text-blue-700">
              Authorization: Bearer dat_abc123...
            </code>
            <p className="mt-2 text-xs text-blue-600">
              Generate at Dashboard → API Keys. Keys are hashed SHA-256 — shown once on creation.
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-xs font-semibold text-purple-800">JWT (for user-context apps)</p>
            <code className="mt-1 block text-xs text-purple-700">
              Authorization: Bearer eyJhbGc...
            </code>
            <p className="mt-2 text-xs text-purple-600">
              Obtain via <code className="rounded bg-purple-100 px-1">POST /auth/signin</code>. Expires in 1 hour — use <code className="rounded bg-purple-100 px-1">POST /auth/refresh</code> to rotate.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint reference */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900 mr-2">API Reference</h2>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                activeTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map((ep) => (
            <div key={`${ep.method}${ep.path}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
              <span className={`w-16 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-bold ${METHOD_COLORS[ep.method] ?? 'bg-gray-100 text-gray-700'}`}>
                {ep.method}
              </span>
              <code className="flex-1 text-xs text-gray-800 font-mono">/api/v1{ep.path}</code>
              <span className="text-xs text-gray-500 hidden sm:block">{ep.desc}</span>
              <span className="text-xs text-gray-400 rounded bg-gray-100 px-1.5 py-0.5">{ep.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rate limits & errors */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Rate Limits</h2>
          <p className="mt-2 text-xs text-gray-600">
            Rate limits are per API key, reset monthly. Exceeded requests return{' '}
            <code className="rounded bg-gray-100 px-1">429 Too Many Requests</code>.
          </p>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-1">Tier</th>
                <th className="pb-1">Req/month</th>
                <th className="pb-1">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { tier: 'Free', limit: '1,000', price: '$0' },
                { tier: 'Pro', limit: '10,000', price: '$9/mo' },
                { tier: 'Enterprise', limit: '100,000', price: 'Custom' },
              ].map(({ tier, limit, price }) => (
                <tr key={tier}>
                  <td className="py-1.5 font-medium text-gray-800">{tier}</td>
                  <td className="py-1.5 text-gray-600">{limit}</td>
                  <td className="py-1.5 text-gray-600">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Error Format</h2>
          <p className="mt-2 text-xs text-gray-600">
            All errors return consistent JSON with <code className="rounded bg-gray-100 px-1">error.message</code> and{' '}
            <code className="rounded bg-gray-100 px-1">error.code</code>.
          </p>
          <pre className="mt-3 rounded-lg bg-gray-900 p-3 text-xs text-red-400 font-mono overflow-x-auto">
{`// 401 Unauthorized
{
  "error": {
    "message": "Invalid or revoked API key",
    "code": "401"
  }
}

// 400 Validation error
{
  "error": {
    "message": "name is required",
    "code": "VALIDATION_ERROR"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Webhooks */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Webhooks & Integrations</h2>
        <p className="mt-2 text-sm text-gray-600">
          Real-time event delivery to any endpoint. Events are signed with{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">X-DAT-Signature</code> (HMAC-SHA256).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { event: 'activity.logged',    desc: 'Fires when an activity is marked complete/partial/skipped.' },
            { event: 'mood.logged',         desc: 'Fires when a mood + energy rating is submitted.' },
            { event: 'streak.achieved',     desc: 'Fires on 3, 7, 14, 30, 60, 100-day milestones.' },
            { event: 'insight.generated',   desc: 'Fires when a new AI coaching insight is ready.' },
            { event: 'challenge.accepted',  desc: 'Fires when a friend accepts a streak challenge.' },
          ].map(({ event, desc }) => (
            <div key={event} className="rounded-lg border border-gray-100 p-3">
              <code className="text-xs font-bold text-purple-700 bg-purple-50 rounded px-1.5 py-0.5">{event}</code>
              <p className="mt-1.5 text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <a href="/dashboard/integrations" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            🔗 Manage Integrations
          </a>
          <span className="text-xs text-gray-500">Use the Webhook Tester at Dashboard → Integrations to verify your endpoint.</span>
        </div>
      </div>
    </div>
  );
}
