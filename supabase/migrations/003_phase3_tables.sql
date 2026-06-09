-- Phase 3: Intelligence — mood, spiritual, AI insights, coaching, scheduling, wellness

CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_rating INTEGER NOT NULL CHECK(mood_rating BETWEEN 1 AND 5),
  energy_level INTEGER NOT NULL CHECK(energy_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK(sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS fasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vrat_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in_progress','completed')),
  mood_rating INTEGER CHECK(mood_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mantra_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID,
  mantra_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_week_start DATE NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'weekly_review',
  insight_title TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  insight_data JSONB,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  was_acted_upon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, insight_week_start, insight_type)
);

CREATE TABLE IF NOT EXISTS ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK(message_type IN ('miss_streak','plan_recalibration','encouragement')),
  message_text TEXT NOT NULL,
  triggered_reason TEXT,
  was_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  was_opened BOOLEAN NOT NULL DEFAULT false,
  user_acted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_json JSONB NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'ai_generated' CHECK(plan_type IN ('ai_generated','user_custom')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  adherence_rate REAL NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_text TEXT NOT NULL,
  tip_text_hi TEXT,
  tip_category TEXT NOT NULL DEFAULT 'general_wellness',
  season TEXT CHECK(season IN ('summer','monsoon','winter','spring')),
  dosha TEXT CHECK(dosha IN ('vata','pitta','kapha')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dosha_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_dosha TEXT NOT NULL DEFAULT 'vata' CHECK(primary_dosha IN ('vata','pitta','kapha')),
  secondary_dosha TEXT CHECK(secondary_dosha IN ('vata','pitta','kapha')),
  determined_via TEXT NOT NULL DEFAULT 'quiz' CHECK(determined_via IN ('quiz','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantra_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosha_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_own" ON mood_logs USING (auth.uid() = user_id);
CREATE POLICY "fasts_own" ON fasts USING (auth.uid() = user_id);
CREATE POLICY "mantra_own" ON mantra_logs USING (auth.uid() = user_id);
CREATE POLICY "insights_own" ON ai_insights USING (auth.uid() = user_id);
CREATE POLICY "coach_own" ON ai_coach_messages USING (auth.uid() = user_id);
CREATE POLICY "plans_own" ON scheduled_plans USING (auth.uid() = user_id);
CREATE POLICY "dosha_own" ON dosha_profiles USING (auth.uid() = user_id);
CREATE POLICY "tips_public_read" ON wellness_tips FOR SELECT USING (true);
