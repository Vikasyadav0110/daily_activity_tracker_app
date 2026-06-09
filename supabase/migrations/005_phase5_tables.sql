-- Phase 5: AI Coaching Scale
-- Tables: coach_personas, user_programs, program_tasks, program_progress, coaching_sessions, coaching_messages

-- ─────────────────────────────────────────────
-- Coach personas (seeded, not user-created)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_personas (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  tagline       TEXT NOT NULL,
  description   TEXT NOT NULL,
  avatar_emoji  TEXT NOT NULL DEFAULT '🤖',
  color         TEXT NOT NULL DEFAULT '#1565C0',
  specialty     TEXT NOT NULL,             -- e.g. 'fitness', 'mindfulness', 'productivity'
  system_prompt TEXT NOT NULL,
  is_premium    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed coach personas
INSERT INTO coach_personas (id, name, tagline, description, avatar_emoji, color, specialty, system_prompt, is_premium) VALUES
  ('motivator',    'Arjun',      'Your high-energy motivator',     'Pushes you hard, celebrates wins loudly, never lets you quit.',          '💪', '#BF360C', 'motivation',    'You are Arjun, a high-energy fitness and life motivator coach. You are enthusiastic, direct, and push users to do their best. Keep messages short, punchy, and motivating. Use Hindi words naturally (like "yaar", "bhai") for warmth. Never be soft on excuses but always be kind.',                          FALSE),
  ('mindful',      'Priya',      'Your mindfulness guide',         'Calm, present, grounded — helps you find peace in daily chaos.',         '🧘', '#2E7D32', 'mindfulness',   'You are Priya, a mindfulness and wellness coach. You are calm, empathetic, and speak with warmth. Guide users towards self-awareness, breathing, and present-moment focus. Use gentle affirmations. Draw from Yoga, Vedanta, and modern mindfulness practices.',                                             FALSE),
  ('fitness',      'Vikram',     'Your personal fitness coach',    'Science-backed fitness plans, form corrections, progressive overload.',   '🏋️', '#1565C0', 'fitness',       'You are Vikram, a certified personal fitness coach. Provide science-backed advice on exercise, recovery, and nutrition. Be precise with reps, sets, and form cues. Adapt to the user''s fitness level. Always prioritize safety over performance.',                                                        TRUE),
  ('productivity', 'Ananya',     'Your productivity mentor',       'Deep work, time-blocking, and systematic habit stacking.',               '⚡', '#6A1B9A', 'productivity',  'You are Ananya, a productivity and systems coach. Help users design efficient routines, apply deep work principles, and eliminate distractions. Use frameworks like GTD, Pomodoro, and Atomic Habits. Be practical, structured, and results-oriented.',                                                       TRUE),
  ('spiritual',    'Swami Dev',  'Your spiritual guide',           'Vedic wisdom, mantra, dharma — purpose-driven living.',                  '🕉️', '#E65100', 'spiritual',     'You are Swami Dev, a spiritual guide grounded in Vedic philosophy, Bhagavad Gita, and Yoga Sutras. Guide users towards dharma, inner peace, and purposeful living. Speak with serenity and depth. Use Sanskrit terms with explanations. Avoid dogma — embrace universal spiritual principles.',                 TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- User's selected coach persona
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_coach_preferences (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_persona   TEXT NOT NULL DEFAULT 'motivator' REFERENCES coach_personas(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_coach_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own coach prefs" ON user_coach_preferences
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Habit programs (templates + user enrollments)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  persona_id    TEXT REFERENCES coach_personas(id),
  category      TEXT NOT NULL,              -- 'fitness', 'mindfulness', 'productivity', 'spiritual', 'custom'
  difficulty    TEXT NOT NULL DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  is_premium    BOOLEAN NOT NULL DEFAULT FALSE,
  is_template   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE habit_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads templates" ON habit_programs FOR SELECT USING (is_template = TRUE);
CREATE POLICY "users manage own programs" ON habit_programs
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Seed 3 starter programs
INSERT INTO habit_programs (id, title, description, duration_days, persona_id, category, difficulty, is_premium, is_template) VALUES
  ('30day-morning', '30-Day Morning Warrior', 'Build an unbreakable morning routine: wake early, exercise, meditate, and plan your day.', 30, 'motivator', 'productivity', 'beginner', FALSE, TRUE),
  ('21day-mindful', '21-Day Mindfulness Reset', 'Daily breathwork, journaling, and digital detox practices to reduce stress and increase focus.', 21, 'mindful', 'mindfulness', 'beginner', FALSE, TRUE),
  ('60day-fitness', '60-Day Body Transformation', 'Progressive strength training + nutrition habits. Science-backed, coach-guided.', 60, 'fitness', 'fitness', 'intermediate', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Program tasks (daily task templates per program)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES habit_programs(id) ON DELETE CASCADE,
  day_number  INTEGER NOT NULL,             -- 1-based day within program
  title       TEXT NOT NULL,
  description TEXT,
  task_type   TEXT NOT NULL DEFAULT 'habit', -- 'habit', 'reflection', 'challenge', 'rest'
  duration_minutes INTEGER,
  xp_reward   INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, day_number, title)
);

ALTER TABLE program_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads program tasks" ON program_tasks FOR SELECT USING (TRUE);

-- ─────────────────────────────────────────────
-- User program enrollments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id    UUID NOT NULL REFERENCES habit_programs(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_end_at TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'abandoned'
  current_day   INTEGER NOT NULL DEFAULT 1,
  completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, program_id, started_at)
);

ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own enrollments" ON user_programs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Program task completions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
  task_id         UUID NOT NULL REFERENCES program_tasks(id),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reflection      TEXT,
  UNIQUE(user_program_id, task_id)
);

ALTER TABLE program_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own progress" ON program_progress
  USING (EXISTS (SELECT 1 FROM user_programs up WHERE up.id = user_program_id AND up.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_programs up WHERE up.id = user_program_id AND up.user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Coaching sessions (conversation threads per persona)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id  TEXT NOT NULL REFERENCES coach_personas(id),
  title       TEXT,                          -- auto-generated from first message
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own sessions" ON coaching_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Individual messages in a coaching session
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own messages" ON coaching_messages
  USING (EXISTS (SELECT 1 FROM coaching_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM coaching_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Habit predictions (ML-lite streak risk scores)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id   UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  risk_score    NUMERIC(4,3) NOT NULL,       -- 0.000 to 1.000 (1 = high risk of missing)
  reasoning     TEXT,
  predicted_for DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_id, predicted_for)
);

ALTER TABLE habit_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own predictions" ON habit_predictions
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user ON coaching_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_session ON coaching_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_programs_user ON user_programs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habit_predictions_user ON habit_predictions(user_id, predicted_for DESC);
