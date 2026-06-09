-- =============================================================================
-- Phase 3 — PostgreSQL Schema (Daily Activity Tracker — Intelligence)
-- Database: Supabase PostgreSQL
-- New tables: 8 (mood_logs, fasts, mantra_logs, ai_insights,
--               ai_coach_messages, scheduled_plans, wellness_tips, dosha_profiles)
-- Prerequisites: Phase 2 migration applied (users table exists)
-- Claude API cost: ~$0.003/call (weekly review)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 20. mood_logs
-- Daily mood/energy/sleep check-in. One row per user per date.
-- Pearson correlation computed in-app against activity completion rate.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_logs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date          TEXT        NOT NULL,                        -- YYYY-MM-DD
    mood_rating   SMALLINT    NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
    -- 1 = Very bad | 2 = Bad | 3 = Neutral | 4 = Good | 5 = Very good
    energy_level  SMALLINT    NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
    -- 1 = Exhausted | 3 = Normal | 5 = Energized
    sleep_quality SMALLINT    CHECK (sleep_quality BETWEEN 1 AND 5),
    -- 1 = Terrible | 5 = Excellent (nullable — user may skip)
    notes         TEXT,                                        -- Optional 1–2 sentence journal entry
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date DESC);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood_logs_own_rows" ON mood_logs
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 21. fasts
-- Vrat and fasting session records.
-- Supported fasts: Ekadashi, Karwa Chauth, Navratri, Ramadan, Maha Shivaratri, Custom.
-- start_time/end_time are device-local times (Asia/Kolkata assumed).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fasts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vrat_name    TEXT        NOT NULL,
    -- Ekadashi | Karwa Chauth | Navratri | Ramadan | Maha Shivaratri | Custom
    start_date   TEXT        NOT NULL,                         -- YYYY-MM-DD
    end_date     TEXT        NOT NULL,                         -- YYYY-MM-DD (same as start for single-day)
    start_time   TEXT,                                         -- HH:MM (sunrise varies by location)
    end_time     TEXT,                                         -- HH:MM when fast breaks
    status       TEXT        NOT NULL DEFAULT 'planned',       -- planned | in_progress | completed | broken
    mood_rating  SMALLINT    CHECK (mood_rating BETWEEN 1 AND 5),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fasts_user_date ON fasts(user_id, start_date DESC);

ALTER TABLE fasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fasts_own_rows" ON fasts
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 22. mantra_logs
-- Individual mantra/pooja counting sessions (digital mala counter).
-- Supported mantras: Om, Gayatri, Hanuman Chalisa, Surya Namaskar, Custom.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantra_logs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id      UUID,                                     -- optional link to a Spiritual activity
    mantra_name      TEXT        NOT NULL,
    -- Om | Gayatri | Hanuman Chalisa | Surya Namaskar | Custom
    count            INTEGER     NOT NULL CHECK (count > 0),   -- Repetitions (e.g. 108, 1000)
    duration_minutes INTEGER,
    date             TEXT        NOT NULL,                     -- YYYY-MM-DD
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mantra_user_date ON mantra_logs(user_id, date DESC);

ALTER TABLE mantra_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mantra_logs_own_rows" ON mantra_logs
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 23. ai_insights
-- Claude API-generated weekly review insights. One row per user per week.
-- insight_data carries structured payload for rendering charts/graphics.
-- Claude prompt: summarise 7-day activity data; return Hindi + English insight.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_insights (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_week_start  TEXT        NOT NULL,                  -- YYYY-MM-DD (always a Monday)
    insight_type        TEXT        NOT NULL DEFAULT 'weekly_review',
    -- weekly_review | pattern | recommendation
    insight_title       TEXT        NOT NULL,                  -- "Consistency Hero 🔥"
    insight_text        TEXT        NOT NULL,                  -- Full Claude-generated paragraph
    insight_data        JSONB       NOT NULL DEFAULT '{}',
    -- {"streaks":[...],"top_activities":[...],"patterns":[...],"recommendations":[...]}
    xp_reward           INTEGER     NOT NULL DEFAULT 0,        -- XP awarded for acting on recommendation
    was_acted_upon      BOOLEAN     NOT NULL DEFAULT FALSE,
    viewed_at           TIMESTAMPTZ,                           -- NULL = not yet opened
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, insight_week_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_week ON ai_insights(user_id, insight_week_start DESC);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insights_own_rows" ON ai_insights
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 24. ai_coach_messages
-- AI-generated re-engagement nudges delivered as push notifications.
-- Triggers: missed 2+ days, low completion rate, exam date approaching.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_coach_messages (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type     TEXT        NOT NULL,
    -- miss_streak | plan_recalibration | encouragement | exam_nudge
    message_text     TEXT        NOT NULL,                     -- Claude-generated content
    triggered_reason TEXT        NOT NULL,
    -- missed_2_days | low_completion_rate | exam_date_approaching
    sent_at          TIMESTAMPTZ,                              -- NULL = not yet sent
    was_opened       BOOLEAN     NOT NULL DEFAULT FALSE,
    user_acted       BOOLEAN     NOT NULL DEFAULT FALSE,       -- logged activity after opening?
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_user_sent ON ai_coach_messages(user_id, sent_at DESC);

ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_coach_messages_own_rows" ON ai_coach_messages
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 25. scheduled_plans
-- AI-generated or user-custom daily time-block schedules.
-- plan_json is an ordered array of time-blocked activities.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_plans (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name      TEXT        NOT NULL,                       -- "UPSC Study Schedule"
    plan_json      JSONB       NOT NULL,
    -- [{"time":"06:00","activity":"Pooja","duration_min":30,"activity_id":"..."},...]
    plan_type      TEXT        NOT NULL,                       -- ai_generated | user_custom
    status         TEXT        NOT NULL DEFAULT 'active',      -- active | archived
    adherence_rate NUMERIC(5,4),                               -- 0.0000–1.0000 (e.g. 0.8500 = 85%)
    start_date     TEXT        NOT NULL,                       -- YYYY-MM-DD plan activated
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_plans_user_status ON scheduled_plans(user_id, status);

ALTER TABLE scheduled_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduled_plans_own_rows" ON scheduled_plans
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 26. wellness_tips
-- Curated Ayurveda and seasonal wellness content. Seeded by admin.
-- 100+ tips across Vata/Pitta/Kapha doshas and all 4 seasons.
-- No user FK — shared reference data filtered at query time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_tips (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tip_text       TEXT        NOT NULL,
    tip_category   TEXT        NOT NULL,                       -- ayurveda | seasonal | general_wellness | spiritual
    season         TEXT,                                       -- summer | monsoon | winter | spring | NULL (year-round)
    dosha          TEXT,                                       -- vata | pitta | kapha | NULL (all doshas)
    language       TEXT        NOT NULL DEFAULT 'en',          -- en | hi | ta | te | bn
    display_order  INTEGER     NOT NULL DEFAULT 0,
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellness_tips_category_season ON wellness_tips(tip_category, season, language);
CREATE INDEX IF NOT EXISTS idx_wellness_tips_dosha ON wellness_tips(dosha, language) WHERE is_active = TRUE;

-- No RLS needed — wellness_tips is public read-only data
ALTER TABLE wellness_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wellness_tips_public_read" ON wellness_tips FOR SELECT USING (is_active = TRUE);


-- ---------------------------------------------------------------------------
-- 27. dosha_profiles
-- User's Ayurvedic constitution (Vata/Pitta/Kapha) determined via onboarding quiz.
-- Used to personalise wellness tip selection and morning schedule suggestions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dosha_profiles (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    primary_dosha         TEXT        NOT NULL,                -- vata | pitta | kapha
    secondary_dosha       TEXT,                                -- NULL = single-dosha constitution
    dosha_determined_via  TEXT        NOT NULL DEFAULT 'quiz', -- quiz | admin
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dosha_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dosha_profiles_own_row" ON dosha_profiles
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- Phase 3 backfill: populate analytics_daily.mood_rating from mood_logs
-- Run after Phase 3 migration to sync any existing mood_logs into analytics.
-- ---------------------------------------------------------------------------
UPDATE analytics_daily ad
SET    mood_rating = ml.mood_rating,
       updated_at  = now()
FROM   mood_logs ml
WHERE  ml.user_id = ad.user_id
  AND  ml.date    = ad.date
  AND  ad.mood_rating IS NULL;
