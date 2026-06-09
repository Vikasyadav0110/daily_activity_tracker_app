import { getDatabase } from '@services/db/database';
import { supabase } from '@services/supabase/client';

export type Plan =
  | 'free'
  | 'pro_monthly'
  | 'pro_annual'
  | 'lifetime_pro'
  | 'premium_plus_monthly'
  | 'premium_plus_annual';

export type SubStatus = 'active' | 'inactive' | 'expired' | 'cancelled';

export interface SubscriptionState {
  plan: Plan;
  status: SubStatus;
  expiresAt: string | null;
  isPro: boolean;
  isPremiumPlus: boolean;
}

export const PLANS = {
  pro_monthly: {
    id: 'pro_monthly' as Plan,
    label: 'Pro Monthly',
    price: 99,
    currency: 'INR',
    period: 'month' as const,
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_MONTHLY ?? '',
  },
  pro_annual: {
    id: 'pro_annual' as Plan,
    label: 'Pro Annual',
    price: 799,
    currency: 'INR',
    period: 'year' as const,
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_ANNUAL ?? '',
    savingsLabel: 'Save 33%',
  },
  lifetime_pro: {
    id: 'lifetime_pro' as Plan,
    label: 'Lifetime Pro',
    price: 999,
    currency: 'INR',
    period: 'lifetime' as const,
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_LIFETIME ?? '',
  },
  premium_plus_monthly: {
    id: 'premium_plus_monthly' as Plan,
    label: 'Premium+ Monthly',
    price: 149,
    currency: 'INR',
    period: 'month' as const,
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_PP_MONTHLY ?? '',
    savingsLabel: 'AI Coach + Mood + Spiritual',
  },
  premium_plus_annual: {
    id: 'premium_plus_annual' as Plan,
    label: 'Premium+ Annual',
    price: 1490,
    currency: 'INR',
    period: 'year' as const,
    razorpayPlanId: process.env.EXPO_PUBLIC_RAZORPAY_PLAN_PP_ANNUAL ?? '',
    savingsLabel: 'Save 17%',
  },
} as const;

export const PRO_FEATURES = {
  cloud_sync: { key: 'cloud_sync', title: 'Cloud Sync & Backup' },
  advanced_analytics: { key: 'advanced_analytics', title: 'Advanced Analytics' },
  csv_export: { key: 'csv_export', title: 'CSV Export' },
  social_friends: { key: 'social_friends', title: 'Friends & Leaderboard' },
  challenges: { key: 'challenges', title: 'Friend Challenges' },
} as const;

export const PREMIUM_PLUS_FEATURES = {
  ai_weekly_review: { key: 'ai_weekly_review', title: 'AI Weekly Review' },
  ai_coach: { key: 'ai_coach', title: 'AI Coach Nudges' },
  mood_tracking: { key: 'mood_tracking', title: 'Mood & Wellbeing Tracking' },
  mood_correlation: { key: 'mood_correlation', title: 'Activity-Mood Correlation' },
  vrat_fasting: { key: 'vrat_fasting', title: 'Vrat & Fasting Tracker' },
  mantra_counter: { key: 'mantra_counter', title: 'Pooja & Mantra Counter' },
  ayurveda_tips: { key: 'ayurveda_tips', title: 'Personalised Ayurveda Tips' },
  smart_schedule: { key: 'smart_schedule', title: 'AI Smart Scheduling' },
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;
export type PremiumPlusFeatureKey = keyof typeof PREMIUM_PLUS_FEATURES;

export function isProPlan(plan: Plan): boolean {
  return plan !== 'free';
}

export function isPremiumPlusPlan(plan: Plan): boolean {
  return plan === 'premium_plus_monthly' || plan === 'premium_plus_annual';
}

export async function getLocalSubscription(): Promise<SubscriptionState> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    plan: Plan;
    status: SubStatus;
    expires_at: string | null;
  }>('SELECT plan, status, expires_at FROM local_subscription WHERE id = 1');

  if (!row) return { plan: 'free', status: 'inactive', expiresAt: null, isPro: false, isPremiumPlus: false };

  const now = new Date().toISOString();
  const expired = row.expires_at !== null && row.expires_at < now;
  const status: SubStatus = expired ? 'expired' : row.status;
  const active = status === 'active';

  return {
    plan: row.plan,
    status,
    expiresAt: row.expires_at,
    isPro: isProPlan(row.plan) && active,
    isPremiumPlus: isPremiumPlusPlan(row.plan) && active,
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

  const active = status === 'active';
  return {
    plan,
    status,
    expiresAt: data.expires_at as string | null,
    isPro: isProPlan(plan) && active,
    isPremiumPlus: isPremiumPlusPlan(plan) && active,
  };
}
