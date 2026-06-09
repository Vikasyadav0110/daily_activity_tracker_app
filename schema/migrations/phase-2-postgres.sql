-- =============================================================================
-- Phase 2 — PostgreSQL Schema (Daily Activity Tracker)
-- Database: Supabase PostgreSQL
-- New tables: 11 (users, user_profiles, friends, leaderboards, challenges,
--               shares, subscriptions, team_workspaces, team_members,
--               team_challenges, analytics_daily)
-- Prerequisites: Supabase project created; auth.users managed by Supabase Auth
-- Migration: Run via Supabase Dashboard > SQL Editor or supabase db push
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ---------------------------------------------------------------------------
-- 9. users
-- Extends Supabase auth.users. One row created on first sign-up.
-- auth.users is managed by Supabase Auth; this table holds app-specific fields.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),  -- mirrors auth.users.id
    email               TEXT        UNIQUE NOT NULL,
    display_name        TEXT,
    profile_picture_url TEXT,
    phone               TEXT,
    auth_provider       TEXT        NOT NULL DEFAULT 'email', -- email | google | apple
    is_local_only       BOOLEAN     NOT NULL DEFAULT TRUE,    -- TRUE = Phase 1 local mode
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only read/update their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_row" ON users
    USING (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- 10. user_profiles
-- Extended social profile. Created alongside the users row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language             TEXT        NOT NULL DEFAULT 'en',    -- en | hi | ta | te | bn
    theme                TEXT        NOT NULL DEFAULT 'light', -- light | dark
    timezone             TEXT        NOT NULL DEFAULT 'Asia/Kolkata',
    notification_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    bio                  TEXT        CHECK (char_length(bio) <= 160),
    profile_visibility   TEXT        NOT NULL DEFAULT 'friends', -- private | friends | public
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_own_row" ON user_profiles
    USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_friends_read" ON user_profiles
    FOR SELECT
    USING (
        profile_visibility = 'public'
        OR auth.uid() = user_id
        OR (
            profile_visibility = 'friends' AND
            EXISTS (
                SELECT 1 FROM friends f
                WHERE f.status = 'accepted'
                  AND ((f.user_id = auth.uid() AND f.friend_user_id = user_id)
                    OR (f.friend_user_id = auth.uid() AND f.user_id = user_id))
            )
        )
    );


-- ---------------------------------------------------------------------------
-- 11. friends
-- Bidirectional friendship. One row per pair (initiator's direction).
-- App queries BOTH directions: user_id = me AND friend_user_id = me.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friends (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- request sender
    friend_user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- request recipient
    status          TEXT        NOT NULL DEFAULT 'pending',   -- pending | accepted | blocked
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user    ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend  ON friends(friend_user_id, status);

CREATE TRIGGER trg_friends_updated_at
    BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friends_own_rows" ON friends
    USING (auth.uid() = user_id OR auth.uid() = friend_user_id);


-- ---------------------------------------------------------------------------
-- 12. leaderboards
-- Pre-computed XP snapshot rows. Refreshed by a scheduled job.
-- type = 'weekly' uses week_start; type = 'monthly' uses week_start (month start);
-- type = 'all_time' has week_start = NULL.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leaderboards (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type TEXT        NOT NULL,                     -- weekly | monthly | all_time
    xp_total         INTEGER     NOT NULL DEFAULT 0,
    rank             INTEGER,                                   -- Computed; 1 = top
    week_start       TEXT,                                      -- YYYY-MM-DD (Monday) — NULL for all_time
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_week ON leaderboards(leaderboard_type, week_start);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user      ON leaderboards(user_id);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboards_read_all" ON leaderboards FOR SELECT USING (TRUE);  -- public rankings
CREATE POLICY "leaderboards_own_write" ON leaderboards
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 13. challenges
-- Individual, friend, and team challenges with progress tracking.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type TEXT        NOT NULL,                       -- weekly_auto | friend | team
    activity_id    UUID,                                       -- NULL = generic challenge
    target_count   INTEGER     NOT NULL,
    target_metric  TEXT        NOT NULL,                       -- days | hours | activities
    current_count  INTEGER     NOT NULL DEFAULT 0,
    status         TEXT        NOT NULL DEFAULT 'active',      -- active | completed | failed
    xp_reward      INTEGER     NOT NULL DEFAULT 0,
    start_date     TEXT        NOT NULL,                       -- YYYY-MM-DD
    end_date       TEXT        NOT NULL,                       -- YYYY-MM-DD
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_user_status ON challenges(user_id, status);

CREATE TRIGGER trg_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_own_rows" ON challenges
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 14. shares
-- Records every share event (streak cards, weekly summaries, achievements).
-- Used to compute WhatsApp share rate KPI.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shares (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type    TEXT        NOT NULL,                      -- streak_card | weekly_summary | achievement
    content_data    JSONB       NOT NULL DEFAULT '{}',         -- {"streak_days":14,"activity":"Gym"}
    share_platform  TEXT,                                      -- whatsapp | instagram | twitter
    share_count     INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_user_type ON shares(user_id, content_type);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shares_own_rows" ON shares
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 15. subscriptions
-- One row per user. Tracks Razorpay billing state and active tier.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type         TEXT         NOT NULL DEFAULT 'free',
    -- free | pro_monthly | pro_yearly | lifetime | premium_plus_monthly
    -- premium_plus_yearly | family | college | b2b
    razorpay_subscription_id  TEXT,        -- Razorpay recurring sub ID (UPI Autopay)
    razorpay_payment_id       TEXT,        -- Last successful payment ID
    status                    TEXT         NOT NULL DEFAULT 'active', -- active | cancelled | expired | trial
    amount_paid               NUMERIC(10,2),                   -- INR
    billing_cycle             TEXT,                             -- monthly | yearly | one_time
    trial_ends_at             TIMESTAMPTZ,
    starts_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
    renewal_at                TIMESTAMPTZ,
    cancelled_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own_row" ON subscriptions
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 16. team_workspaces
-- Container for B2B corporate teams. Created by HR admins.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_workspaces (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name    TEXT        NOT NULL,
    admin_user_id UUID       NOT NULL REFERENCES users(id),
    member_count INTEGER     NOT NULL DEFAULT 1,               -- cached; updated by trigger
    max_members  INTEGER     NOT NULL DEFAULT 500,
    status       TEXT        NOT NULL DEFAULT 'active',        -- active | paused | archived
    company_name TEXT,
    industry     TEXT,
    invite_code  TEXT        UNIQUE NOT NULL,                  -- Short alphanumeric join code
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_workspaces_admin ON team_workspaces(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_workspaces_invite ON team_workspaces(invite_code);

CREATE TRIGGER trg_team_workspaces_updated_at
    BEFORE UPDATE ON team_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE team_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_workspaces_members_read" ON team_workspaces FOR SELECT
    USING (
        auth.uid() = admin_user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
    );
CREATE POLICY "team_workspaces_admin_write" ON team_workspaces
    USING (auth.uid() = admin_user_id);


-- ---------------------------------------------------------------------------
-- 17. team_members
-- Maps users to team workspaces with role.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id   UUID        NOT NULL REFERENCES team_workspaces(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      TEXT        NOT NULL DEFAULT 'member',           -- admin | manager | member
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_own_or_admin" ON team_members
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM team_workspaces tw
            WHERE tw.id = team_id AND tw.admin_user_id = auth.uid()
        )
    );


-- ---------------------------------------------------------------------------
-- 18. team_challenges
-- Company-wide challenges created by HR admins.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_challenges (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID        NOT NULL REFERENCES team_workspaces(id) ON DELETE CASCADE,
    challenge_name  TEXT        NOT NULL,
    description     TEXT,
    target_count    INTEGER     NOT NULL,
    target_metric   TEXT        NOT NULL,                      -- steps | days | hours | activities
    start_date      TEXT        NOT NULL,                      -- YYYY-MM-DD
    end_date        TEXT        NOT NULL,                      -- YYYY-MM-DD
    status          TEXT        NOT NULL DEFAULT 'active',     -- active | completed | cancelled
    created_by      UUID        NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_challenges_team_status ON team_challenges(team_id, status);

ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_challenges_members_read" ON team_challenges FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid())
    );
CREATE POLICY "team_challenges_admin_write" ON team_challenges
    USING (
        EXISTS (
            SELECT 1 FROM team_workspaces tw
            WHERE tw.id = team_id AND tw.admin_user_id = auth.uid()
        )
    );


-- ---------------------------------------------------------------------------
-- 19. analytics_daily
-- Pre-aggregated daily stats. One row per user per date.
-- Updated by a background function after each activity log event.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_daily (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date                   TEXT        NOT NULL,               -- YYYY-MM-DD
    activities_logged      INTEGER     NOT NULL DEFAULT 0,     -- any status
    activities_completed   INTEGER     NOT NULL DEFAULT 0,
    activities_skipped     INTEGER     NOT NULL DEFAULT 0,
    activities_missed      INTEGER     NOT NULL DEFAULT 0,
    total_duration_minutes INTEGER     NOT NULL DEFAULT 0,
    xp_earned              INTEGER     NOT NULL DEFAULT 0,
    mood_rating            SMALLINT    CHECK (mood_rating BETWEEN 1 AND 5), -- backfilled by Phase 3
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date ON analytics_daily(user_id, date DESC);

CREATE TRIGGER trg_analytics_daily_updated_at
    BEFORE UPDATE ON analytics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_daily_own_rows" ON analytics_daily
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- Phase 1 → Phase 2 Migration: Data sync path
-- On first cloud sign-up, the mobile app runs a one-time bulk INSERT:
--   1. Upload all local SQLite activities rows → cloud activities table
--      (needs cloud activities table — add below or create separately)
--   2. Upload all activity_logs, streaks, exam_prep, exam_logs, mock_tests, badges
--   3. Set app_settings.user_id = auth.users.id
--   4. Set users.is_local_only = FALSE
--
-- NOTE: The cloud also needs mirror tables for Phase 1 entities.
-- These are the same structures as SQLite but use UUID PKs and have user_id FK.
-- Add them here to support sync:
-- ---------------------------------------------------------------------------

-- Cloud mirror of Phase 1 `activities` (UUID-based)
CREATE TABLE IF NOT EXISTS cloud_activities (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id         INTEGER,                                   -- original SQLite rowid (for conflict detection)
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT        NOT NULL,
    category         TEXT        NOT NULL,
    icon             TEXT        NOT NULL DEFAULT '⚡',
    frequency        TEXT        NOT NULL DEFAULT 'daily',
    target_duration  INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_archived      BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cloud_activities_user ON cloud_activities(user_id, is_archived);

ALTER TABLE cloud_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cloud_activities_own_rows" ON cloud_activities
    USING (auth.uid() = user_id);

-- Cloud mirror of Phase 1 `activity_logs` (UUID-based)
CREATE TABLE IF NOT EXISTS cloud_activity_logs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id         INTEGER,                                   -- original SQLite rowid
    activity_id      UUID        NOT NULL REFERENCES cloud_activities(id) ON DELETE CASCADE,
    log_date         TEXT        NOT NULL,
    duration_minutes INTEGER,
    quantity         REAL,
    status           TEXT        NOT NULL DEFAULT 'completed',
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (activity_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_cloud_activity_logs_date     ON cloud_activity_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_cloud_activity_logs_activity ON cloud_activity_logs(activity_id);

ALTER TABLE cloud_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cloud_activity_logs_own_rows" ON cloud_activity_logs
    USING (
        EXISTS (SELECT 1 FROM cloud_activities ca WHERE ca.id = activity_id AND ca.user_id = auth.uid())
    );
