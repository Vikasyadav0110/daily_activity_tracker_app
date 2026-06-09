import { getDatabase } from '@services/db/database';
import { supabase } from '@services/supabase/client';

export type Plan = 'free' | 'pro_monthly' | 'pro_annual';
export type SubStatus = 'active' | 'inactive' | 'expired' | 'cancelled';

export interface SubscriptionState {
  plan: Plan;
  status: SubStatus;
  expiresAt: string | null;
  isPro: boolean;
}

export const PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    price: 99,
    currency: 'INR',
    period: 'month',
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_MONTHLY ?? '',
  },
  pro_annual: {
    id: 'pro_annual',
    label: 'Pro Annual',
    price: 799,
    currency: 'INR',
    period: 'year',
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_ANNUAL ?? '',
    savingsLabel: 'Save 33%',
  },
} as const;

export const PRO_FEATURES = {
  cloud_sync: { key: 'cloud_sync', title: 'Cloud Sync & Backup' },
  advanced_analytics: { key: 'advanced_analytics', title: 'Advanced Analytics' },
  csv_export: { key: 'csv_export', title: 'CSV Export' },
  social_friends: { key: 'social_friends', title: 'Friends & Leaderboard' },
  challenges: { key: 'challenges', title: 'Friend Challenges' },
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;

export async function getLocalSubscription(): Promise<SubscriptionState> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    plan: Plan;
    status: SubStatus;
    expires_at: string | null;
  }>('SELECT plan, status, expires_at FROM local_subscription WHERE id = 1');

  if (!row) return { plan: 'free', status: 'inactive', expiresAt: null, isPro: false };

  const now = new Date().toISOString();
  const expired = row.expires_at !== null && row.expires_at < now;
  const status: SubStatus = expired ? 'expired' : row.status;

  return {
    plan: row.plan,
    status,
    expiresAt: row.expires_at,
    isPro: row.plan !== 'free' && status === 'active',
  };
}

export async function saveLocalSubscription(
  plan: Plan,
  status: SubStatus,
  expiresAt: string | null,
  razorpayPaymentId: string,
  razorpaySubscriptionId?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_subscription SET
       plan = ?, status = ?, expires_at = ?,
       razorpay_payment_id = ?, razorpay_subscription_id = ?,
       verified_at = datetime('now'), updated_at = datetime('now')
     WHERE id = 1`,
    [
      plan,
      status,
      expiresAt,
      razorpayPaymentId,
      razorpaySubscriptionId ?? null,
    ]
  );
}

/** Sync subscription status from Supabase to local cache (call on app start when signed in). */
export async function syncSubscriptionFromCloud(userId: string): Promise<SubscriptionState> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at, razorpay_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return getLocalSubscription();

  const now = new Date().toISOString();
  const expired = data.expires_at !== null && (data.expires_at as string) < now;
  const status: SubStatus = expired ? 'expired' : (data.status as SubStatus);
  const plan: Plan = (data.plan as Plan) ?? 'free';

  await saveLocalSubscription(plan, status, data.expires_at as string | null, '', data.razorpay_subscription_id as string | undefined);

  return {
    plan,
    status,
    expiresAt: data.expires_at as string | null,
    isPro: plan !== 'free' && status === 'active',
  };
}
