// Shared types mirroring the Supabase schema and mobile app data models

export interface Activity {
  id: number;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;       // 'daily' | 'weekly' | 'weekdays' | 'weekends'
  target_count: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string;
  activity_id: number;
  log_date: string;        // YYYY-MM-DD
  count: number;
  notes: string | null;
  created_at: string;
}

export interface MoodLog {
  id: number;
  date: string;
  mood_rating: number;     // 1-5
  energy_level: number;    // 1-5
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
}

export interface AiInsight {
  id: string;
  insight_week_start: string;
  insight_title: string;
  insight_text: string;
  xp_reward: number;
  viewed_at: string | null;
  was_acted_upon: number;
  created_at: string;
}

export interface Subscription {
  plan: string;
  status: string;
  expires_at: string | null;
}

export interface TeamMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
}

export interface ApiKey {
  id: string;
  key_prefix: string;
  key_name: string;
  tier: 'free' | 'pro' | 'enterprise';
  requests_this_month: number;
  rate_limit: number;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
}

export type Plan =
  | 'free'
  | 'pro_monthly'
  | 'pro_annual'
  | 'lifetime_pro'
  | 'premium_plus_monthly'
  | 'premium_plus_annual';

export function isPro(plan: Plan): boolean { return plan !== 'free'; }
export function isPremiumPlus(plan: Plan): boolean {
  return plan === 'premium_plus_monthly' || plan === 'premium_plus_annual';
}
