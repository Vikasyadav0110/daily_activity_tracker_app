-- ============================================================
-- Phase 2 Growth — Supabase PostgreSQL tables
-- Run: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================

-- users (mirrors Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_picture_url TEXT,
  phone TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',   -- "email","google","apple"
  is_local_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  notification_enabled BOOLEAN DEFAULT true,
  bio TEXT,
  profile_visibility TEXT DEFAULT 'private',     -- "private","friends","public"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- friends
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',                 -- "pending","accepted","blocked"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL,                -- "weekly","monthly","all_time"
  xp_total INTEGER DEFAULT 0,
  rank INTEGER,
  week_start TEXT,                               -- YYYY-MM-DD (Monday)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,                  -- "weekly_auto","friend","team"
  activity_id UUID,
  target_count INTEGER NOT NULL DEFAULT 7,
  target_metric TEXT NOT NULL DEFAULT 'days',    -- "days","hours","activities"
  status TEXT DEFAULT 'active',                  -- "active","completed","failed"
  xp_reward INTEGER DEFAULT 50,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- shares
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,                    -- "streak_card","weekly_summary","achievement"
  content_data JSONB,
  share_platform TEXT,                           -- "whatsapp","instagram","twitter"
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL,               -- "pro_monthly","pro_yearly","lifetime","family","college"
  razorpay_subscription_id TEXT,
  status TEXT DEFAULT 'active',                  -- "active","cancelled","expired","trial"
  amount_paid REAL,                              -- INR
  billing_cycle TEXT,                            -- "monthly","yearly","one_time"
  start_date DATE,
  renewal_date DATE,
  cancel_date DATE,
  trial_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_workspaces
CREATE TABLE IF NOT EXISTS team_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  admin_user_id UUID REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 500,
  status TEXT DEFAULT 'active',                  -- "active","paused","archived"
  company_name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',                    -- "admin","manager","member"
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- team_challenges
CREATE TABLE IF NOT EXISTS team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_workspaces(id) ON DELETE CASCADE,
  challenge_name TEXT NOT NULL,
  description TEXT,
  target_count INTEGER,
  target_metric TEXT,                            -- "steps","days","hours"
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',                  -- "active","completed","cancelled"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- analytics_daily (aggregate: one row per user per day)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activities_logged INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  activities_skipped INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  mood_rating SMALLINT,                          -- 1-5, populated Phase 3
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Cloud mirrors of Phase 1 SQLite entities (for cross-device sync)
CREATE TABLE IF NOT EXISTS cloud_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  local_id INTEGER,                              -- SQLite PK from Phase 1 device
  name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  frequency TEXT,
  target_duration INTEGER,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cloud_activity_id UUID REFERENCES cloud_activities(id) ON DELETE CASCADE,
  local_activity_id INTEGER,
  log_date DATE NOT NULL,
  duration_minutes INTEGER,
  quantity REAL,
  status TEXT DEFAULT 'completed',               -- "completed","skipped","missed"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sync queue (tracks last sync per user)
CREATE TABLE IF NOT EXISTS sync_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMPTZ DEFAULT now(),
  activities_synced INTEGER DEFAULT 0,
  logs_synced INTEGER DEFAULT 0
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cloud_activities_user ON cloud_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_logs_user_date ON cloud_activity_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_type ON leaderboards(user_id, leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- ============================================================
-- Row-Level Security (enable on all user tables)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — users can only read/write their own data
-- ============================================================
CREATE POLICY "users_own" ON users USING (auth.uid() = id);
CREATE POLICY "user_profiles_own" ON user_profiles USING (auth.uid() = user_id);
CREATE POLICY "friends_own" ON friends USING (auth.uid() = user_id OR auth.uid() = friend_user_id);
CREATE POLICY "leaderboards_own" ON leaderboards USING (auth.uid() = user_id);
CREATE POLICY "challenges_own" ON challenges USING (auth.uid() = user_id);
CREATE POLICY "shares_own" ON shares USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_own" ON subscriptions USING (auth.uid() = user_id);
CREATE POLICY "cloud_activities_own" ON cloud_activities USING (auth.uid() = user_id);
CREATE POLICY "cloud_logs_own" ON cloud_activity_logs USING (auth.uid() = user_id);
CREATE POLICY "analytics_own" ON analytics_daily USING (auth.uid() = user_id);
CREATE POLICY "sync_state_own" ON sync_state USING (auth.uid() = user_id);

-- Team workspace: admin + members can read; only admin can write
CREATE POLICY "team_workspaces_member_read" ON team_workspaces
  FOR SELECT USING (
    auth.uid() = admin_user_id OR
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
  );
CREATE POLICY "team_workspaces_admin_write" ON team_workspaces
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "team_workspaces_admin_update" ON team_workspaces
  FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "team_members_read" ON team_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM team_workspaces tw WHERE tw.id = team_id AND tw.admin_user_id = auth.uid())
  );
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM team_workspaces tw WHERE tw.id = team_id AND tw.admin_user_id = auth.uid())
  );

CREATE POLICY "team_challenges_read" ON team_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid())
  );
CREATE POLICY "team_challenges_admin_write" ON team_challenges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_workspaces tw WHERE tw.id = team_id AND tw.admin_user_id = auth.uid())
  );
