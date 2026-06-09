'use client';

import { useState } from 'react';
import Link from 'next/link';

const TABS = ['Overview', 'Members', 'Departments', 'SSO', 'Audit Logs', 'Export'] as const;
type Tab = typeof TABS[number];

const SSO_PROVIDERS = [
  { id: 'google_workspace', name: 'Google Workspace', icon: '🔵', docs: 'https://support.google.com/a/answer/6087519' },
  { id: 'microsoft_365',    name: 'Microsoft 365',    icon: '🟦', docs: 'https://docs.microsoft.com/en-us/azure/active-directory/manage-apps/configure-saml-single-sign-on' },
  { id: 'okta',             name: 'Okta',             icon: '🔷', docs: 'https://developer.okta.com/docs/guides/saml-application-setup/' },
  { id: 'custom_saml',      name: 'Custom SAML 2.0',  icon: '🔐', docs: null },
];

export default function EnterprisePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<{ invited?: number; skipped?: number; error?: string } | null>(null);
  const [ssoProvider, setSsoProvider] = useState('');
  const [ssoEntityId, setSsoEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [ssoCert, setSsoCert] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Admin</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your organization workspace, members, SSO, and compliance exports.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/enterprise/analytics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            📊 Manager Analytics
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Seats Used',     value: '—',    sub: 'of — total' },
              { label: 'Active Members', value: '—',    sub: 'users' },
              { label: 'Departments',    value: '—',    sub: 'teams' },
              { label: 'SSO Status',     value: '—',    sub: 'provider' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Start</h2>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Create an organization via the API or use an existing one.', done: false },
                { step: '2', text: 'Bulk invite employees via CSV under the Members tab.', done: false },
                { step: '3', text: 'Configure Google Workspace or Microsoft 365 SSO under the SSO tab.', done: false },
                { step: '4', text: 'Assign departments and managers for reporting.', done: false },
                { step: '5', text: 'Export compliance data at any time from the Export tab.', done: false },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                    {step}
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Enterprise Pricing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2">Seats</th>
                    <th className="pb-2">Price/seat/mo</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { seats: '10–99',     price: '₹199', discount: '—',    features: 'SSO, bulk invite, audit logs' },
                    { seats: '100–499',   price: '₹169', discount: '15%',  features: '+ department reporting' },
                    { seats: '500–999',   price: '₹149', discount: '25%',  features: '+ custom branding' },
                    { seats: '1,000+',    price: 'Custom', discount: '30%+', features: '+ SLA, dedicated support' },
                  ].map(({ seats, price, discount, features }) => (
                    <tr key={seats}>
                      <td className="py-2 font-medium text-gray-800 dark:text-gray-200">{seats}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{price}</td>
                      <td className="py-2 text-green-600 dark:text-green-400">{discount}</td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">{features}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      {activeTab === 'Members' && (
        <div className="space-y-6">
          {/* Single invite */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Invite Member</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Send an invitation to a single employee. They will receive a magic-link email.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                placeholder="employee@company.com"
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Send Invite
              </button>
            </div>
          </div>

          {/* Bulk CSV invite */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Bulk CSV Invite</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Upload a CSV with up to <strong>2,000 employees</strong> per batch. Columns: <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">email</code> (required),{' '}
              <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">role</code>, <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">department</code>.
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-4">
                <textarea
                  placeholder={`email,role,department\nraj@acme.com,member,Engineering\npriya@acme.com,manager,Marketing\namit@acme.com,admin,HR`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent text-xs font-mono text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const lines = csvText.trim().split('\n');
                    const dataLines = lines.filter((l) => l.includes('@'));
                    setCsvResult({ invited: dataLines.length, skipped: 0 });
                  }}
                  disabled={!csvText.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg transition-colors"
                >
                  Preview Import
                </button>
                <label className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  Upload File
                  <input type="file" accept=".csv" className="sr-only" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    file.text().then(setCsvText);
                  }} />
                </label>
                <span className="text-xs text-gray-400">Max 5 MB · CSV format</span>
              </div>

              {csvResult && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm">
                  {csvResult.error ? (
                    <p className="text-red-700 dark:text-red-400">{csvResult.error}</p>
                  ) : (
                    <p className="text-green-700 dark:text-green-400">
                      Ready to invite <strong>{csvResult.invited}</strong> employees
                      {csvResult.skipped ? ` · ${csvResult.skipped} rows skipped (invalid)` : ''}.
                      <button className="ml-3 font-semibold underline hover:no-underline" onClick={() => setCsvResult(null)}>
                        Send invites via API →
                      </button>
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">API: Bulk invite</p>
                <p>POST /api/v1/org/:org_id/members/bulk-invite</p>
                <p>Content-Type: multipart/form-data  // attach CSV as 'file'</p>
                <p>Authorization: Bearer YOUR_TOKEN</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments */}
      {activeTab === 'Departments' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Department Hierarchy</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Create departments and sub-departments. Assign managers to unlock anonymized team analytics.
            </p>

            <div className="flex gap-2 flex-wrap mb-4">
              <input
                placeholder="Department name"
                className="flex-1 min-w-[180px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">No parent (top-level)</option>
              </select>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Add
              </button>
            </div>

            {/* Example tree */}
            <div className="rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { indent: 0, name: 'Engineering',      members: 48, manager: 'Raj Mehta' },
                { indent: 1, name: '↳ Backend',         members: 20, manager: '—' },
                { indent: 1, name: '↳ Frontend',        members: 18, manager: '—' },
                { indent: 1, name: '↳ DevOps',          members: 10, manager: '—' },
                { indent: 0, name: 'Marketing',         members: 22, manager: 'Priya Sharma' },
                { indent: 0, name: 'HR',                members: 8,  manager: 'Amit Patel' },
              ].map(({ indent, name, members, manager }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm" style={{ paddingLeft: `${16 + indent * 24}px` }}>
                  <span className="flex-1 font-medium text-gray-800 dark:text-gray-200">{name}</span>
                  <span className="text-xs text-gray-400">{members} members</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{manager}</span>
                  <button className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SSO */}
      {activeTab === 'SSO' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Single Sign-On (SAML 2.0)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Configure your Identity Provider. Members can log in with their corporate credentials — no separate password needed.
            </p>

            {/* Provider picker */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              {SSO_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSsoProvider(p.id)}
                  className={`rounded-xl border-2 p-3 text-center transition-colors ${
                    ssoProvider === p.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{p.name}</p>
                </button>
              ))}
            </div>

            {ssoProvider && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">IdP Entity ID</label>
                  <input
                    value={ssoEntityId}
                    onChange={(e) => setSsoEntityId(e.target.value)}
                    placeholder="https://accounts.google.com/o/saml2?idpid=C0xxxxxxx"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SSO URL (IdP Login URL)</label>
                  <input
                    value={ssoUrl}
                    onChange={(e) => setSsoUrl(e.target.value)}
                    placeholder="https://accounts.google.com/o/saml2/idp/SSO/redirect?idpid=C0xxxxxxx"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">X.509 Certificate (IdP public key)</label>
                  <textarea
                    value={ssoCert}
                    onChange={(e) => setSsoCert(e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDdDCC...&#10;-----END CERTIFICATE-----"
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={!ssoEntityId || !ssoUrl}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg transition-colors"
                  >
                    Save SSO Config
                  </button>
                  {SSO_PROVIDERS.find((p) => p.id === ssoProvider)?.docs && (
                    <a
                      href={SSO_PROVIDERS.find((p) => p.id === ssoProvider)?.docs ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Setup guide →
                    </a>
                  )}
                </div>

                {/* SP details for IdP */}
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Configure these values in your IdP:</p>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">ACS URL:</span>
                    <code className="text-gray-800 dark:text-gray-200 break-all">
                      https://app.dailyactivitytracker.com/api/v1/org/YOUR_ORG_ID/sso/acs
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">SP Entity ID:</span>
                    <code className="text-gray-800 dark:text-gray-200 break-all">
                      https://app.dailyactivitytracker.com/org/YOUR_ORG_ID/saml
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Name ID format:</span>
                    <code className="text-gray-800 dark:text-gray-200">emailAddress</code>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">SP Metadata:</span>
                    <a href={`/api/v1/org/YOUR_ORG_ID/sso?format=metadata`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      Download XML
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === 'Audit Logs' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">Audit Log</h2>
              <select className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option>All actions</option>
                <option>member.invite</option>
                <option>member.deprovision</option>
                <option>member.sso_login</option>
                <option>sso.configured</option>
                <option>export.requested</option>
              </select>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Export →</button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {[
                { action: 'member.bulk_invite',  actor: 'raj@acme.com',   detail: '143 employees invited',          time: '2026-06-09 14:23' },
                { action: 'sso.configured',      actor: 'raj@acme.com',   detail: 'provider: google_workspace',      time: '2026-06-09 14:18' },
                { action: 'member.invite',        actor: 'priya@acme.com', detail: 'amit@acme.com (manager)',        time: '2026-06-09 13:50' },
                { action: 'org.updated',          actor: 'raj@acme.com',   detail: 'logo_url, seats_count updated',  time: '2026-06-09 12:05' },
                { action: 'department.created',   actor: 'raj@acme.com',   detail: 'Engineering / Backend',          time: '2026-06-09 11:30' },
                { action: 'export.requested',     actor: 'raj@acme.com',   detail: 'format: json',                   time: '2026-06-08 09:15' },
              ].map(({ action, actor, detail, time }, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 text-xs">
                  <span className="font-mono text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded px-1.5 py-0.5 shrink-0">
                    {action}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{detail}</span>
                  <span className="text-gray-400 shrink-0 hidden sm:block">{actor}</span>
                  <span className="text-gray-300 dark:text-gray-600 shrink-0">{time}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Showing sample data. Connect an organization to view live audit logs.</p>
        </div>
      )}

      {/* Export */}
      {activeTab === 'Export' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Compliance Data Export</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Export member roster and audit logs (last 90 days) for compliance, HR systems, or data retention requirements.
              Each export is recorded in the audit log.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  format: 'json',
                  icon: '{ }',
                  label: 'JSON Export',
                  desc: 'Structured data for programmatic ingestion. Includes members, roles, departments, and audit logs.',
                },
                {
                  format: 'csv',
                  icon: '⬡',
                  label: 'CSV Export',
                  desc: 'Spreadsheet-compatible. Open in Excel, Google Sheets, or import into HRIS systems.',
                },
              ].map(({ format, icon, label, desc }) => (
                <div key={format} className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl w-8 text-center shrink-0">{icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">{desc}</p>
                      <a
                        href={`/api/v1/org/YOUR_ORG_ID/export?format=${format}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        ↓ Download {format.toUpperCase()}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> Replace <code className="bg-amber-100 dark:bg-amber-900/40 rounded px-1">YOUR_ORG_ID</code> with your organization ID.
              Find it via <code className="bg-amber-100 dark:bg-amber-900/40 rounded px-1">GET /api/v1/org</code>.
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Included in Export</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { section: 'Members', items: ['User ID, email, role', 'Department assignment', 'Invite date, join date', 'Deprovision date (if applicable)'] },
                { section: 'Audit Logs', items: ['Actor + action + timestamp', 'Resource type and ID', 'IP address', 'Last 90 days of events'] },
              ].map(({ section, items }) => (
                <div key={section}>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{section}</p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
