'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Subscription } from '@/lib/types';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'Pro (Monthly)',
  pro_annual: 'Pro (Annual)',
  lifetime_pro: 'Pro (Lifetime)',
  premium_plus_monthly: 'Premium+ (Monthly)',
  premium_plus_annual: 'Premium+ (Annual)',
};

interface Props {
  user: User;
  subscription: Subscription | null;
}

export function SettingsForm({ user, subscription }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>(user.user_metadata?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: displayName } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: `${location.origin}/auth/callback?next=/dashboard/settings`,
    });
    alert('Password reset email sent.');
  }

  const plan = subscription?.plan ?? 'free';
  const isPro = plan !== 'free';

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              value={user.email ?? ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" onClick={handlePasswordReset}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Reset Password
            </button>
          </div>
        </form>
      </section>

      {/* Subscription */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Subscription</h2>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${isPro ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            {PLAN_LABELS[plan] ?? plan}
          </div>
          {subscription?.status === 'active' && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
          )}
          {subscription?.expires_at && (
            <span className="text-xs text-gray-400">
              Renews {new Date(subscription.expires_at).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
        {!isPro && (
          <a href="/upgrade"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            ⚡ Upgrade to Pro
          </a>
        )}
      </section>

      {/* Danger zone */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-red-100 dark:border-red-900/50 space-y-4">
        <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Deleting your account is permanent and cannot be undone. All data will be erased.
        </p>
        <button className="px-5 py-2.5 border border-red-300 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Delete Account
        </button>
      </section>
    </div>
  );
}
