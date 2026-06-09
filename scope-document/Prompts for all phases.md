<h1 style="color:#1565C0; border-bottom:3px solid #1565C0; padding-bottom:8px;">PHASE 1 PROMPT — Daily Activity Tracker MVP (Weeks 1–8)</h1>

> Copy-paste this entire section into Claude Code to begin Phase 1 execution.

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PROJECT BRIEF</h2>

**Project:** Daily Activity Tracker App — Phase 1 MVP  
**Client:** Vikas (Founder, Project Management Lead)  
**Target Market:** India (pan-India, Hindi-first)  
**This Phase:** Weeks 1–8 (8 weeks, 4 sprints × 2 weeks)  
**Full Timeline:** 12 months total — Phase 1: 8w · Phase 2: 10w · Phase 3: 12w · Phase 4: 18w  
**Phase 1 Goal:** Ship offline-first habit tracker to App Store + Google Play. 50,000 downloads in 30 days · 45% Day-7 retention · 4.3+ stars  
**Overall Goal:** Build India's #1 habit tracking + corporate wellness platform (₹5Cr+ ARR by year-end)

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">YOUR ROLES — You Are the Entire Product & Engineering Team</h2>

| Role | Responsibilities |
|---|---|
| **BA** (Business Analyst) | User stories (Gherkin), journey maps, data validation rules, acceptance criteria, India compliance (DPDP Act) |
| **PM** (Product Manager) | Sprint boards, PRDs, roadmap, risk register, dependency tracking, weekly summaries, go/no-go decisions |
| **Dev** (Full-Stack Developer) | Production React Native (Expo) code, SQLite schema + migrations, offline logic, localization, architecture docs |
| **QA** (Quality Assurance) | Test plans, manual + automated test cases, bug logging with severity, regression suites, performance testing |
| **DevOps** | CI/CD (GitHub Actions + EAS Build), build envs, secrets, store submission checklists, crash reporting, analytics |

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">HOW YOU WORK</h2>

- Phase-by-phase, sprint-by-sprint (2-week sprints)
- Daily standup: Yesterday / Today / Blockers
- Weekly progress summary: sprint % complete, bugs found/fixed, performance metrics
- Biweekly retrospective: what went well, what to improve, velocity, action items
- Deliverables: working production code (not pseudocode), docs, test cases, deployment configs
- Quality gates: zero critical bugs, all test cases pass before phase exit

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">CORE PRODUCT VISION</h2>

**Daily Activity Tracker** is a mobile-first, offline-first, India-optimized habit tracking app.

### Target Users (Personas)

| Persona | Profile | Goal | Pain Point | Solution |
|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 years | No integrated study tracker | Exam prep mode: subjects, mock logs, study streak |
| **Priya** | 28, IT professional, Delhi | Consistent fitness habit | Forgets to log, wants streak motivation | One-tap logging, streak viz, WhatsApp sharing |
| **Amit** | 35, business owner, Mumbai | Track daily pooja + fasting + yoga | No app respects Hindu practices | Vrat tracker, mantra counter, spiritual badges |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Corporate workspace, team leaderboard, manager dashboard |

### Key Differentiators
- Exam prep mode (UPSC, JEE, NEET, SSC, Banking) — 30M aspirants market
- Offline-first — critical for India (poor connectivity)
- Hindi + regional languages — UI in user's language
- Spiritual features — vrat, pooja, Ayurveda (Phase 3)
- India-tuned pricing — ₹49/mo Pro, ₹999 lifetime
- WhatsApp-first sharing — viral organic growth loop
- AI coach (Claude API) — personalized, not generic (Phase 3)
- Corporate wellness B2B — ₹199/seat/month (Phase 2)

### Overall Success Metrics (All Phases)

| Phase | MAU | ARR | Retention |
|---|---|---|---|
| Phase 1 (MVP) | 50K downloads | — | 45% D7 · 4.3+ stars |
| Phase 2 (Growth) | 150K MAU | ₹50L | 30% Day-60 |
| Phase 3 (Intelligence) | 300K MAU | ₹1.4Cr | 35% Day-90 · NPS ≥50 |
| Phase 4 (Ecosystem) | 600K+ MAU | ₹5Cr+ | 500+ enterprises · 1,000+ API devs |

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 OBJECTIVE</h2>

**Timeline:** Weeks 1–8 (8 weeks, 4 sprints)  
**Prerequisites:** None — this is the starting point  
**Target:** 50,000 downloads · 45% Day-7 retention · 4.3+ star rating · < 5% crash rate

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 FEATURES</h2>

### Must-Have (Phase 1 MVP)
- Language selection (Hindi + English + Tamil + Telugu + Bengali at launch)
- Onboarding quiz — goal setting, starter templates (3 questions max)
- **One-tap activity check-off — ZERO LAG, < 100ms, CRITICAL SUCCESS FACTOR**
- Daily schedule view (timeline of today's activities)
- Streak counter with 48-hour forgiveness window
- Calendar heatmap (monthly view, color intensity = activity density)
- Push notifications — reminders + morning/evening check-ins
- Offline-first SQLite — 100% functional without internet
- Dark mode (light/dark theme toggle)
- Basic gamification — 7-day, 14-day, 30-day badges
- Exam prep mode (UPSC, JEE, NEET, SSC, Banking):
  - Syllabus tracker (% completion per subject)
  - Study logger (hours, subject, difficulty)
  - Mock test tracker (scores, trends, subject-wise analysis)
- No login required — local-only, privacy-first

### Should Have (Stretch Goals)
- Voice input in Hindi
- WhatsApp-shareable streak cards (9:16 format)
- Home screen widget
- Quantity tracking (water glasses, steps, etc.)
- Activity history export (CSV)

### Won't Have (Phase 1)
- Cloud sync · Friends / leaderboards · AI insights · Vrat/pooja tracking · Corporate wellness · Video coaching · Marketplace · Wearable support

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 TECH STACK</h2>

| Layer | Technology |
|---|---|
| Framework | React Native (Expo 51 / RN 0.74) — single codebase iOS + Android |
| State | Zustand + React Query |
| Database | SQLite (expo-sqlite) — local only, offline-first |
| Localization | i18next (hi, en, ta, te, bn) |
| UI | React Native Paper + custom components |
| Navigation | React Navigation (bottom tabs) |
| Notifications | Expo Notifications |
| Build | EAS Build (Expo Application Services) |
| CI/CD | GitHub Actions (lint + test + build) |
| Distribution | TestFlight (iOS beta) · Google Play Open Testing (Android) |
| Crash reporting | Sentry |
| Analytics | PostHog (opt-in) |
| Backend | None in Phase 1 — design schema for Phase 2 Supabase migration |

> ⚠️ **CRITICAL CONSTRAINT:** One-Tap Check-Off must be sub-100ms latency. Measure with React Native Performance API on every build. Optimize relentlessly.

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 DATABASE SCHEMA (SQLite)</h2>

```sql
-- activities
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                          -- nullable (Phase 2 cloud sync)
  name TEXT NOT NULL,                    -- "Gym", "Study UPSC"
  category TEXT,                         -- "fitness","study","spiritual","work","health","custom"
  icon TEXT,                             -- emoji or icon name
  frequency TEXT,                        -- "daily","weekly","{mon,wed,fri}","custom"
  target_duration INTEGER,               -- minutes, nullable
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT 0
);

-- activity_logs
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,                -- YYYY-MM-DD
  duration_minutes INTEGER,             -- nullable
  quantity REAL,                         -- nullable (e.g. 8 glasses water)
  status TEXT DEFAULT 'completed',       -- "completed","skipped","missed"
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id),
  UNIQUE(activity_id, log_date)
);

-- streaks
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL UNIQUE,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  streak_start_date TEXT,               -- YYYY-MM-DD
  last_logged_date TEXT,                -- YYYY-MM-DD
  forgiveness_used BOOLEAN DEFAULT 0,   -- 48h grace used this cycle?
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- exam_prep
CREATE TABLE exam_prep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL UNIQUE,
  exam_type TEXT,                        -- "UPSC","JEE","NEET","SSC","Banking"
  subjects TEXT,                         -- JSON: [{ name, completion_pct }]
  exam_date TEXT,                        -- YYYY-MM-DD
  syllabus_coverage_pct INTEGER DEFAULT 0, -- 0–100
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- exam_logs
CREATE TABLE exam_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject TEXT,
  study_hours REAL,                      -- e.g. 2.5
  difficulty TEXT,                       -- "easy","medium","hard"
  log_date TEXT,                         -- YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);

-- mock_tests
CREATE TABLE mock_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject TEXT,                          -- nullable for full-paper tests
  score INTEGER,
  total_marks INTEGER,
  test_date TEXT,                        -- YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);

-- badges
CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER,                   -- nullable for global badges
  badge_key TEXT UNIQUE,                 -- "streak_7","streak_30","studied_100_hours"
  badge_name TEXT,
  badge_icon TEXT,
  unlocked_at DATETIME,                  -- null if not yet earned
  is_earned BOOLEAN DEFAULT 0,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- app_settings
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                          -- nullable (local-only Phase 1)
  language TEXT DEFAULT 'en',           -- "hi","en","ta","te","bn"
  theme TEXT DEFAULT 'light',           -- "light","dark"
  timezone TEXT DEFAULT 'Asia/Kolkata',
  notification_enabled BOOLEAN DEFAULT 1,
  reminder_times TEXT,                   -- JSON: [{ activity_id, time:"08:00" }]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_activities_archived ON activities(is_archived);
CREATE INDEX idx_activity_logs_date ON activity_logs(log_date);
CREATE INDEX idx_activity_logs_activity ON activity_logs(activity_id);
CREATE INDEX idx_exam_logs_date ON exam_logs(log_date);
CREATE INDEX idx_mock_tests_exam ON mock_tests(exam_id);
```

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 API SPECIFICATION (Design for Phase 2 — Local Only in Phase 1)</h2>

```
-- Phase 1 is local SQLite only. Design these REST contracts now for Phase 2 Supabase backend.
POST /api/auth/signup            { email, password } -> { user_id, token }
POST /api/activities             { name, category, icon, frequency, target_duration } -> { activity_id }
GET  /api/activities             -> [{ id, name, category, ... }]
POST /api/activity-logs          { activity_id, duration_minutes, quantity, status, notes } -> { log_id }
GET  /api/activity-logs/:date    -> [{ activity_id, status, duration, ... }]
GET  /api/streaks/:activity_id   -> { current_streak, longest_streak, last_logged_date }
GET  /api/badges/:activity_id    -> [{ badge_name, unlocked_date }]
GET  /api/exam-prep/:activity_id -> { exam_type, subjects, exam_date, syllabus_coverage_pct }
```

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 SPRINT BREAKDOWN</h2>

<h3 style="color:#1565C0;">Sprint 1 (Weeks 1–2): Onboarding + Activity Logging Foundation</h3>

<h4 style="color:#1565C0;">BA TASKS</h4>

1. Write 5 user stories in Gherkin format (Given/When/Then):
   - **Story 1:** Language selection — Given app opens, When user selects Hindi, Then entire UI renders in Hindi with no text overflow
   - **Story 2:** Onboarding quiz — Given language selected, When user answers 3 questions (goal, exam mode, exam type), Then answers saved to app_settings and user lands on home
   - **Story 3:** Activity creation — Given home screen, When user creates activity (name + icon + category + frequency), Then activity appears in today's list
   - **Story 4:** One-tap check-off — Given activity in list, When user taps check-off button, Then activity marked done in < 100ms (measured), visual feedback shown
   - **Story 5:** Activity list view — Given activities exist, When user opens home, Then today's activities shown with correct visual hierarchy (completed vs pending vs skipped)

2. Create Raj's user journey map (Day 1 → Week 2):
   - Day 1: Download → Hindi → Onboarding quiz → Exam mode (UPSC) → Set 4h daily study target → Create subjects
   - Day 2–7: Log sessions ("Constitutional Law – 2h – medium") → See streak → Get 8 AM Hindi reminder → Earn "Day 1 Complete" badge
   - Week 2: 7-day streak milestone unlocked → badge earned → Calendar heatmap (10/14 days) → Share streak on WhatsApp → Friends install

3. Define data validation rules:
   - Activity name: 1–50 characters, allow emoji, no special chars except `-` and `/`
   - Frequency: enum — daily, weekly, {mon,wed,fri}, custom
   - Category: enum — fitness, study, spiritual, work, health, custom
   - Log status: enum — completed, skipped, missed
   - Language: enum — hi, en, ta, te, bn

<h4 style="color:#1565C0;">PM TASKS</h4>

1. Create Sprint 1 board (GitHub Projects):
   - List all 5 user stories with task breakdown
   - Estimate each story in hours
   - Assign Dev / QA owners
   - Track dependencies (DB schema must be done before check-off)

2. Write PRD for "Activity Creation & Check-Off Feature":
   - Problem: Users need frictionless habit logging
   - Solution: One-tap check-off with < 100ms response
   - Success metrics: < 100ms latency (measured), 0 crashes, persists across restart
   - Acceptance criteria from user stories

3. Risk register for Sprint 1:
   - **Risk 1:** One-tap latency > 100ms (HIGH impact) — Mitigation: Profile weekly, optimize SQLite write path
   - **Risk 2:** Onboarding quiz too long — Mitigation: Cap at 3 questions, all skippable
   - **Risk 3:** Localization text overflow — Mitigation: Hindi expert review by Week 1, test all strings

<h4 style="color:#1565C0;">DEV TASKS</h4>

1. Set up Expo project:
   ```
   npx create-expo-app daily-activity-tracker --template blank-typescript
   ```
   Install: `expo-sqlite`, `zustand`, `@tanstack/react-query`, `i18next`, `react-i18next`, `react-native-paper`, `@react-navigation/native`, `@react-navigation/bottom-tabs`

2. Create folder structure:
   ```
   src/
   ├── screens/      (LanguageScreen, OnboardingScreen, HomeScreen, ActivityDetailScreen)
   ├── components/   (ActivityCard, CheckoffButton, StreakBadge, CalendarHeatmap)
   ├── db/           (database.ts, migrations/, activitiesRepo.ts, logsRepo.ts, streaksRepo.ts)
   ├── state/        (activitiesStore.ts, settingsStore.ts)
   ├── i18n/         (hi.json, en.json, ta.json, te.json, bn.json)
   ├── utils/        (dateUtils.ts, streakUtils.ts, formatters.ts)
   └── navigation/   (RootNavigator.tsx, TabNavigator.tsx)
   ```

3. Implement SQLite schema migration:
   - Create `src/db/migrations/001_initial.sql` with all 8 tables above
   - Implement `database.ts` (openDatabase, runMigrations, getDb)
   - Seed default badges (streak_7, streak_30, studied_100_hours, etc.)
   - Test: verify tables created on fresh install

4. Implement Language Selection Screen:
   - i18next setup with all 5 locales
   - Language picker UI (flag icons or radio buttons)
   - On select: save to `app_settings.language`, apply globally via i18next
   - Test: switch language → all visible strings update immediately

5. Implement Onboarding Quiz Screen:
   - 3 questions: (1) What do you want to track? (2) Are you preparing for an exam? (3) Which exam?
   - Skip button after question 2
   - Save answers to `app_settings`
   - Navigate to Home on complete or skip

6. Implement Activity Creation Modal:
   - Form: name input, icon selector (emoji grid), category dropdown, frequency picker
   - Validation: required fields, max length
   - On submit: `INSERT INTO activities` → dismiss modal → refresh list

7. Implement Activity List (Home Screen):
   - Fetch today's activities + logs via JOIN
   - Visual states: completed (green check), pending (empty circle), skipped (grey X)
   - Sorted: pending first, then completed, then skipped

8. Implement One-Tap Check-Off — **CRITICAL**:
   - On tap: `INSERT INTO activity_logs` (synchronous SQLite write)
   - Measure latency: `const t0 = performance.now()` → insert → `console.log(performance.now() - t0)`
   - Visual feedback: checkmark animation (< 200ms total)
   - Target: < 100ms from tap to data written + visual update
   - Update streak after log

<h4 style="color:#1565C0;">QA TASKS</h4>

1. Write Test Plan for Sprint 1:
   - Scope: language selection, onboarding, activity CRUD, check-off, data persistence
   - Types: functional, localization (5 languages), device compat (iOS 13+, Android 8+), performance
   - Environments: Expo Go (development), EAS staging build

2. Write 20 test cases with steps + expected results:
   - TC01: Language > Select Hindi > All UI text renders in Hindi, no overflow
   - TC02: Language > Select Tamil > All UI text renders in Tamil, no overflow
   - TC03: Onboarding > Complete all 3 questions > Answers saved in app_settings
   - TC04: Onboarding > Tap Skip > Navigates to Home screen
   - TC05: Activity Create > Enter name + category + frequency > Activity in list
   - TC06: Activity Create > Empty name > Validation error shown
   - TC07: Activity Create > Name 51 chars > Validation error shown
   - TC08: Check-off > Tap activity > Marked done in < 100ms (measured in logs)
   - TC09: Check-off > Tap done activity > Cannot double-log same day
   - TC10: Persistence > Create activity → kill app → reopen → activity still there
   - TC11: Persistence > Check-off activity → kill app → reopen → status still completed
   - TC12: Activity List > Today shows only today's activities
   - TC13: Activity List > Completed items sorted below pending
   - TC14: Localization > Hindi > No text overflow on 5-inch screen
   - TC15: Localization > Bengali > No text overflow on 5-inch screen
   - TC16: Performance > Check-off latency logged < 100ms in console
   - TC17: Device > iOS 13 > App launches without crash
   - TC18: Device > Android 8 > App launches without crash
   - TC19: Memory > Create 20 activities > Memory < 100MB
   - TC20: APK size > After Sprint 1 build > < 8MB

3. Create Manual Test Execution Template:
   - Device model / OS version / Build number / Test case # / Pass/Fail / Screenshot (if fail) / Notes

4. Set up latency measurement baseline:
   - Document check-off latency on 3 different devices (low-end Android, mid-range Android, iPhone)

<h4 style="color:#1565C0;">DEVOPS TASKS</h4>

1. Initialize GitHub repository:
   - `git init`, create `.gitignore` (node_modules, .env, *.sqlite, ios/, android/)
   - Branch strategy: `main` (prod, protected) · `develop` (staging) · `feature/*` (dev)
   - Protect `main` (require PR review, no direct push)

2. Create GitHub Actions CI workflow (`.github/workflows/ci.yml`):
   ```yaml
   on: [pull_request]
   jobs:
     lint-test:
       steps: checkout → npm ci → eslint → prettier check → jest → tsc --noEmit
   ```

3. Set up EAS Build (`eas.json`):
   ```json
   {
     "build": {
       "development": { "developmentClient": true, "distribution": "internal" },
       "staging": { "distribution": "internal" },
       "production": { "distribution": "store" }
     }
   }
   ```

4. Install pre-commit hooks (husky + lint-staged):
   - ESLint + Prettier on staged files before every commit

5. Create `DEVELOPMENT.md`:
   - Node version required (Node 18+)
   - How to run locally (`npx expo start`)
   - How to run on device (Expo Go / USB)
   - How to inspect SQLite (expo-sqlite devtools)
   - How to run tests (`npm test`)

<h4 style="color:#1565C0;">Sprint 1 Acceptance Criteria (Exit Gate)</h4>

- ✓ App launches with language selection screen
- ✓ All 5 languages render correctly (no text overflow on any screen)
- ✓ Onboarding quiz completable or skippable
- ✓ Activities creatable with name + icon + category + frequency
- ✓ One-tap check-off responds in < 100ms (measured + documented)
- ✓ Activities and logs persist across app restart
- ✓ No crashes on iOS 13+, Android 8+
- ✓ All 20 test cases passed (0 critical/high bugs)
- ✓ Latency baseline documented for 3 devices

---

<h3 style="color:#1565C0;">Sprint 2 (Weeks 3–4): Streaks + Calendar + Notifications</h3>

<h4 style="color:#1565C0;">BA TASKS</h4>

1. Write user stories for:
   - Streak display (current streak, longest streak, start date)
   - 48-hour forgiveness (miss 1 day → grace period, miss 2 → reset)
   - Calendar heatmap (monthly view, color intensity)
   - Push notification (reminder at scheduled time in user's language)
   - Morning check-in (8 AM summary of today's plan)
   - Evening check-in (9 PM summary of today's completion)

2. Define streak edge cases:
   - Timezone change mid-streak: use device timezone stored in app_settings
   - Log at 11:58 PM vs 12:02 AM same intent: treat as same day if within 2 hours
   - Leap day: Feb 29 treated as regular day

3. Define notification content in all 5 languages (provide translated strings for hi/ta/te/bn):
   - Morning: "Aaj ka plan: [N] activities scheduled"
   - Evening: "Aaj [N]/[Total] activities complete!"
   - Streak reminder: "Aapki [N]-day streak khatam hone wali hai!"

<h4 style="color:#1565C0;">PM TASKS</h4>

1. Sprint 2 board with task breakdown, estimates, owner assignments
2. Update risk register (latency from Sprint 1 measured — document actual vs target)
3. Write PRD for "Streak + Calendar Feature" (same PRD format as Sprint 1)

<h4 style="color:#1565C0;">DEV TASKS</h4>

1. Implement streak calculation algorithm:
   - On every check-off: update `streaks` table (current_streak, longest_streak, last_logged_date)
   - 48h forgiveness: if `today - last_logged_date = 2 days` and `forgiveness_used = 0`, maintain streak and set `forgiveness_used = 1`
   - If `today - last_logged_date > 2` or second miss: reset `current_streak = 0`, `forgiveness_used = 0`
   - Edge case: multiple check-offs same day → idempotent (no double streak increment)

2. Implement calendar heatmap UI:
   - Monthly grid (weeks as rows, days as columns)
   - Color intensity: 0 logs = light grey, 1–2 = light green, 3–4 = medium green, 5+ = dark green
   - Tap day → show that day's activity log summary
   - Performance: < 500ms render for full month

3. Implement push notifications:
   - Expo Notifications setup (request permission on first open)
   - Schedule daily reminders per activity (user-set time)
   - Schedule morning check-in (8 AM) and evening check-in (9 PM)
   - All notification text from i18n strings (language-aware)
   - No duplicate notifications (cancel old before scheduling new)

4. Implement daily summary card on home screen:
   - "Today: [X]/[Total] activities complete · [N]-day streak 🔥"
   - Tap to expand full day view

5. Set up Sentry crash reporting:
   - Install `@sentry/react-native`
   - Initialize in App.tsx with DSN from environment variable
   - Test: trigger a crash in dev → verify event appears in Sentry dashboard

<h4 style="color:#1565C0;">QA TASKS</h4>

1. Write 20+ test cases for Sprint 2 features:
   - TC21: Streak > Check-off 7 consecutive days > Streak shows 7, badge unlocked
   - TC22: Streak > Miss 1 day (within 48h) > Streak maintained, forgiveness_used=1
   - TC23: Streak > Miss 2 days > Streak resets to 0
   - TC24: Streak > Second miss after forgiveness used > Streak resets
   - TC25: Calendar > View month with 10 logged days > 10 green cells, correct intensity
   - TC26: Calendar > Tap a logged day > Day's activity list shown
   - TC27: Calendar > Render < 500ms > Verify no visible lag
   - TC28: Notification > Schedule 8 AM > Notification arrives at 8 AM
   - TC29: Notification > Change language to Tamil > Notification text in Tamil
   - TC30: Notification > App killed > Notification still arrives

2. Notification timing tests on real devices (iOS + Android)
3. Streak edge case tests: timezone change, leap day, midnight boundary

<h4 style="color:#1565C0;">DEVOPS TASKS</h4>

1. Set up Sentry DSN as EAS secret: `eas secret:create SENTRY_DSN`
2. Configure EAS staging build for beta testing
3. Distribute beta to 5 internal testers via TestFlight + Google Play Internal

<h4 style="color:#1565C0;">Sprint 2 Acceptance Criteria</h4>

- ✓ Streak displays correctly after check-off
- ✓ 48h forgiveness logic verified (all edge cases pass)
- ✓ Calendar heatmap renders in < 500ms for full month
- ✓ Push notifications deliver on time in correct language
- ✓ No duplicate notifications
- ✓ Sentry crash reporting live and tested
- ✓ No regression in Sprint 1 features

---

<h3 style="color:#1565C0;">Sprint 3 (Weeks 5–6): Exam Prep Mode + Gamification</h3>

<h4 style="color:#1565C0;">BA TASKS</h4>

1. Write user stories for:
   - Exam prep setup (select exam type, add subjects, set exam date)
   - Study session log (subject + hours + difficulty)
   - Mock test log (score, total, date)
   - Subject-wise progress (% completion per subject)
   - Weak spot identification ("Constitutional Law — only 20% complete, 40h studied")
   - Badge unlock (streak badges, study hour badges, mock test badges)
   - Daily/weekly challenge display

2. Define all badge triggers:
   - `first_checkoff` — first activity ever completed
   - `streak_3`, `streak_7`, `streak_14`, `streak_30`, `streak_100` — streak milestones
   - `studied_10h`, `studied_50h`, `studied_100h` — cumulative study hours
   - `mock_test_first` — first mock test logged
   - `mock_test_ace` — score ≥ 90% on any mock test
   - `syllabus_50`, `syllabus_100` — syllabus coverage milestones
   - `activities_5` — 5 different activities created

<h4 style="color:#1565C0;">PM TASKS</h4>

1. Sprint 3 board with all exam mode + gamification tasks
2. Phase 1 completion checklist (prepare for Sprint 4 final polish)
3. App Store submission requirements review:
   - Privacy policy URL, Terms of Service URL
   - App description (5 languages), keywords, screenshots (5 per store)
   - Age rating, content category (Health & Fitness)

<h4 style="color:#1565C0;">DEV TASKS</h4>

1. Implement Exam Prep Mode screens:
   - Exam setup screen: exam type dropdown (UPSC/JEE/NEET/SSC/Banking), subject list (add/remove), exam date picker
   - Study logger: subject selector, hours input, difficulty selector, save to `exam_logs`
   - Mock test logger: subject (optional), score, total marks, test date, save to `mock_tests`
   - Progress dashboard: per-subject completion %, study hours, mock score trends (line chart)
   - Weak spots: sort subjects by (completion% / study_hours ratio) → highlight lowest

2. Implement badge system:
   - `badgeService.ts` — evaluates all badge conditions after every check-off/log
   - Badge unlock animation (confetti or scale-up pop)
   - Badge gallery screen (earned + locked badges)
   - Push notification on badge unlock: "Congratulations! You earned [Badge Name] 🏆"

3. Set up PostHog analytics:
   - Install `posthog-react-native`
   - Track events: `activity_created`, `activity_checked_off`, `exam_session_logged`, `badge_unlocked`, `onboarding_completed`
   - All events opt-in only (ask permission in onboarding)

4. App signing setup:
   - Generate iOS distribution certificate + provisioning profile
   - Generate Android keystore
   - Store both securely in EAS secrets

5. APK size audit:
   - Target: < 15 MB
   - Run `eas build` and measure output size
   - If > 15 MB: enable Hermes, enable ProGuard, audit large assets

<h4 style="color:#1565C0;">QA TASKS</h4>

1. Write 25+ test cases for Sprint 3 features:
   - TC31: Exam setup > Select UPSC, add 5 subjects, set exam date > All saved correctly
   - TC32: Study log > Subject + 2.5h + medium > Log appears in history
   - TC33: Study log > Subject progress > Hours cumulate correctly per subject
   - TC34: Mock test > Score 90/100 > "mock_test_ace" badge unlocked
   - TC35: Weak spots > Subject with 10% completion shown first
   - TC36: Badge > 7 consecutive check-offs > streak_7 badge unlocked with animation
   - TC37: Badge > gallery shows earned and locked badges
   - TC38: APK size > Android build < 15 MB
   - TC39: Memory > Exam mode open > < 100 MB RAM
   - TC40: Analytics > activity_checked_off event fires in PostHog

2. Full regression: all Sprint 1 + Sprint 2 test cases re-run (no regressions)
3. Performance test: app startup < 3 seconds on low-end Android (2GB RAM)

<h4 style="color:#1565C0;">DEVOPS TASKS</h4>

1. Store PostHog API key as EAS secret
2. Store Sentry DSN as EAS secret (already done Sprint 2 — verify)
3. Generate and store app signing keys:
   - iOS: distribution certificate + provisioning profile
   - Android: upload keystore to EAS (`eas credentials`)
4. Build production APK and measure size:
   ```bash
   eas build --platform android --profile production
   ```

<h4 style="color:#1565C0;">Sprint 3 Acceptance Criteria</h4>

- ✓ All 5 exam types functional
- ✓ Study sessions logged with subject + hours + difficulty
- ✓ Mock test scores tracked with trend chart
- ✓ Subject-wise progress + weak spots shown accurately
- ✓ All 13 badge types unlock with animation
- ✓ PostHog events firing for all key actions
- ✓ APK < 15 MB, memory < 100 MB, startup < 3s
- ✓ Full Sprint 1+2 regression passed

---

<h3 style="color:#1565C0;">Sprint 4 (Weeks 7–8): Final Polish + App Store Submission</h3>

<h4 style="color:#1565C0;">BA TASKS</h4>

1. Write user-facing onboarding documentation:
   - In-app FAQ (5 most common questions, all 5 languages)
   - "How streak forgiveness works" tooltip
   - "How exam prep mode works" walkthrough

2. Create App Store listing copy:
   - App title: "Daily Activity Tracker — Habit Log"
   - Short description (30 chars): "Track habits, build streaks"
   - Full description (4,000 chars, English + Hindi)
   - Keywords: habit tracker, UPSC study, streak, activity log, daily routine
   - Screenshots descriptions for designer (5 screens per store)

<h4 style="color:#1565C0;">PM TASKS</h4>

1. Final go/no-go decision framework:
   - All acceptance criteria met
   - Zero critical bugs, zero high bugs (or documented accepted risks)
   - Performance targets met (latency, APK size, startup, memory)
   - QA sign-off obtained
   - Privacy policy + ToS approved by Vikas

2. Launch communication plan:
   - WhatsApp broadcast to 200 contacts (Week 8)
   - Physics Wallah community posts (Raj persona)
   - Campus ambassador rollout (100+ ambassadors, ₹500 per referral)

3. Post-launch monitoring plan:
   - Check Sentry daily (Week 1 post-launch)
   - Check reviews daily (respond within 24h)
   - Check PostHog retention (D1, D3, D7)

<h4 style="color:#1565C0;">DEV TASKS</h4>

1. Code review + cleanup:
   - Remove all `console.log` statements (except intentional latency logging)
   - Fix all TypeScript `any` types
   - Ensure no hardcoded strings (all in i18n files)
   - Ensure no hardcoded secrets

2. UI polish pass:
   - Consistent spacing (8px grid)
   - Loading states for all async operations
   - Empty states (no activities yet → onboarding prompt)
   - Error states (SQLite write failure → user-visible message)

3. OTA update setup:
   - Configure `eas update` for hot-fix delivery without store resubmission

4. Accessibility basics:
   - All interactive elements have `accessibilityLabel`
   - Font sizes respect system font scale
   - Minimum touch target: 44×44px

5. Security review:
   - No hardcoded API keys or secrets in source code
   - SQLite file not exposed in app bundle
   - No sensitive data in analytics events

<h4 style="color:#1565C0;">QA TASKS</h4>

1. Full regression: all 60+ test cases from Sprints 1–3
2. Localization final QA — every screen in all 5 languages, no overflow on 5-inch screen
3. Accessibility QA — VoiceOver (iOS) + TalkBack (Android) basics
4. Performance final benchmark:
   - Check-off latency: < 100ms (3 devices)
   - App startup: < 3s (low-end Android)
   - APK: < 15 MB
   - Memory: < 100 MB
5. Beta soak: 2-week TestFlight + Open Testing beta with 50+ testers
6. Release readiness report (all metrics documented)

<h4 style="color:#1565C0;">DEVOPS TASKS</h4>

1. App Store Connect setup:
   - Create app record, fill metadata, upload screenshots (5 per device size)
   - Set privacy nutrition labels
   - Submit for App Review

2. Google Play Console setup:
   - Create app, fill store listing, upload screenshots
   - Set content rating questionnaire
   - Submit to Production track

3. Launch checklist:
   - ✓ Tests passing in CI
   - ✓ No high/critical bugs
   - ✓ Signing keys verified
   - ✓ Privacy policy + ToS URL in store listing
   - ✓ Localization QA passed
   - ✓ APK < 15 MB / memory < 100 MB
   - ✓ Crash reporting on
   - ✓ Analytics wired
   - ✓ Beta 2-week soak complete
   - ✓ PM + Dev final review
   - ✓ Go/No-Go: **GO**

<h4 style="color:#1565C0;">Sprint 4 Acceptance Criteria</h4>

- ✓ All features from Sprints 1–3 regression tested
- ✓ App Store submission package complete (iOS + Android)
- ✓ Beta live on TestFlight + Google Play Open Testing
- ✓ Performance metrics documented and within targets
- ✓ Zero critical bugs, zero high bugs
- ✓ Privacy policy + ToS approved

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 KEY CONSTRAINTS</h2>

1. **ZERO LAG ON ONE-TAP CHECK-OFF** — < 100ms tap-to-feedback. Measure every build. Profile with React Native Performance tools.
2. **OFFLINE-FIRST IS NON-NEGOTIABLE** — 100% offline. No login. No cloud calls.
3. **LANGUAGE SUPPORT FROM DAY 1** — Hindi, English, Tamil, Telugu, Bengali. No overflow. RTL prep.
4. **EXAM PREP MODE MUST BE SOLID** — 30M aspirants market. Subjects + hours + mock scores tracked.
5. **APK < 15 MB** — for low-storage Tier 2/3 India devices.
6. **MEMORY < 100 MB** — for 2GB RAM Android devices.
7. **STARTUP < 3 SECONDS** — on low-end Android.
8. **BATTERY** — no background drain; no background processes.
9. **COMPLIANCE** — DPDP Act readiness, no tracking without consent.

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 QA STRATEGY</h2>

**In scope:** functional (all must-haves) · localization (hi/en/ta/te/bn) · device compat (iOS 13+, Android 8+) · performance (APK/memory/battery/latency) · offline · data integrity (SQLite, streaks, badges) · accessibility basics  
**Out of scope:** security testing (→ Phase 2) · load testing (single-user app)  
**Environments:** Expo Go (dev) · EAS staging · TestFlight beta · Google Play Open Testing

**Sample test — 48h Forgiveness:**
> Given a 7-day streak, when user misses 1 day and logs on day 3 (within 48h), then streak = 7 (not reset), forgiveness_used = 1, next miss resets to 0.

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 DEVOPS STRATEGY</h2>

- **Branching:** `main` (prod, protected) · `develop` (staging) · `feature/*` (dev)
- **CI:** PR→develop runs ESLint + Prettier + Jest + TypeScript check
- **CD:** merge→develop triggers EAS staging build; merge→main triggers EAS prod build
- **Distribution:** TestFlight (iOS) → App Store; Google Play Internal → Open Testing → Production
- **Monitoring:** Sentry (crash) · PostHog (opt-in analytics) · EAS Updates (OTA hotfixes)

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 RISK REGISTER</h2>

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Check-off latency > 100ms | Medium | High | Weekly profiling, optimize SQLite write path |
| 2 | Localization delays | Medium | Medium | Hindi expert by Week 1, professional translation |
| 3 | App Store rejection | Low | High | Review guidelines Week 1, submit beta Week 6 |
| 4 | Campus ambassador recruitment slow | Medium | Medium | Start Week 1, PW partnerships, ₹500 incentive |
| 5 | Exam prep complexity underestimated | Low | Medium | Plan early, simplify mock test MVP if needed |

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 BUDGET (~₹7,50,000 excl. salary)</h2>

| Item | Cost |
|---|---|
| Infra (Supabase free, EAS $30/mo, Sentry/PostHog/GitHub free) | ~₹500/mo |
| Localization (Hindi ₹50K + Tamil/Telugu/Bengali ~₹30K each) | ~₹1,40,000 |
| Campus ambassadors (500 × ₹500 × 2 months + ₹50K materials) | ~₹5,50,000 |
| Apple Developer ($99) + Google Play ($25) | ~₹8,500 |
| Design (app icon, screenshots, marketing) | ~₹50,000 |
| **Total** | **~₹7,50,000** |

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">PHASE 1 EXIT GATE (Week 8 Go/No-Go)</h2>

- ✓ App live on App Store + Google Play (India)
- ✓ All Phase 1 features implemented and regression tested
- ✓ Zero critical bugs, zero high bugs (or accepted risk)
- ✓ Check-off latency < 100ms (documented on 3 devices)
- ✓ APK < 15 MB · Memory < 100 MB · Startup < 3s
- ✓ All 5 languages verified (no overflow)
- ✓ Privacy policy + Terms of Service approved
- ✓ Beta 2-week soak complete (TestFlight + Open Testing)
- ✓ Crash rate < 5% · D7 retention ≥ 45% (from beta data)
- ✓ 4.3+ star rating target set
- ✓ Go/No-Go decision: **GO** (defer 1–2 weeks if not ready)

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">COMMUNICATION CADENCE</h2>

**Daily standup (10 min):**
```
Yesterday: [completed tasks]
Today:     [planned tasks]
Blockers:  [any issues]
```

**Weekly summary (30 min):** Sprint % complete · bugs found/fixed · performance metrics · upcoming blockers

**Biweekly retrospective:** What went well · What to improve · Velocity · Action items

---

<h2 style="color:#1565C0; border-left:5px solid #1565C0; padding-left:12px;">READY TO BUILD — PHASE 1, SPRINT 1, WEEK 1</h2>

Provide immediately:

1. **BA** — 5 Gherkin user stories · Raj's full journey map (Day 1→Week 2) · data validation rules
2. **PM** — Sprint 1 GitHub Projects board · PRD for "Activity Creation & Check-Off" · risk register
3. **Dev** — Expo boilerplate setup · SQLite schema + `database.ts` · Language screen · Onboarding quiz · Activity creation modal · One-tap check-off (< 100ms, measured) · Activity list view
4. **QA** — Test plan + 20 detailed test cases (steps + expected results)
5. **DevOps** — GitHub Actions CI workflow · EAS Build config · pre-commit hooks · `DEVELOPMENT.md`

**Format: production-ready TypeScript code, not pseudocode. No TODOs. All types explicit.**

---
---
---
<h1 style="color:#2E7D32; border-bottom:3px solid #2E7D32; padding-bottom:8px;">PHASE 2 PROMPT — Daily Activity Tracker Growth (Weeks 9–18)</h1>

> Copy-paste this entire section into Claude Code to begin Phase 2 execution.

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PROJECT BRIEF</h2>

**Project:** Daily Activity Tracker App — Phase 2 Growth  
**Client:** Vikas (Founder, Project Management Lead)  
**Target Market:** India (pan-India, Hindi-first)  
**This Phase:** Weeks 9–18 (10 weeks, 5 sprints × 2 weeks)  
**Full Timeline:** 12 months total — Phase 1: 8w · Phase 2: 10w · Phase 3: 12w · Phase 4: 18w  
**Prerequisites:** Phase 1 MVP launched on App Store + Google Play with 50K+ downloads  
**Phase 2 Goal:** 150K MAU · ₹50L ARR · 30% Day-60 retention · 5+ corporate wellness pilots  
**Overall Goal:** Build India's #1 habit tracking + corporate wellness platform (₹5Cr+ ARR by year-end)

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">YOUR ROLES — You Are the Entire Product & Engineering Team</h2>

| Role | Responsibilities |
|---|---|
| **BA** | User stories (Gherkin), journey maps, data validation rules, acceptance criteria, India compliance (DPDP Act, RBI payment guidelines) |
| **PM** | Sprint boards, PRDs, roadmap, risk register, dependency tracking, weekly summaries, go/no-go decisions |
| **Dev** | Production React Native + Node.js + Supabase code, cloud sync logic, Razorpay integration, social features |
| **QA** | Test plans, manual + automated test cases, payment testing (sandbox), sync reliability testing |
| **DevOps** | CI/CD, EAS Build, Supabase project management, Razorpay webhook handling, store update submissions |

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">HOW YOU WORK</h2>

- Phase-by-phase, sprint-by-sprint (2-week sprints)
- Daily standup: Yesterday / Today / Blockers
- Weekly progress summary: sprint % complete, bugs, performance metrics, revenue metrics
- Biweekly retrospective: what went well, what to improve, velocity, action items
- Deliverables: working production code, docs, test cases, deployment configs
- Quality gates: zero critical bugs, all test cases pass before phase exit

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">CORE PRODUCT VISION</h2>

**Daily Activity Tracker** is a mobile-first, offline-first, India-optimized habit tracking app.

### Target Users (Personas)

| Persona | Profile | Goal | Pain Point | Solution |
|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 years | No integrated study tracker | Exam prep mode: subjects, mock logs, study streak |
| **Priya** | 28, IT professional, Delhi | Consistent fitness habit | Forgets to log, wants streak motivation | One-tap logging, streak viz, WhatsApp sharing |
| **Amit** | 35, business owner, Mumbai | Track daily pooja + fasting + yoga | No app respects Hindu practices | Vrat tracker, mantra counter, spiritual badges |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Corporate workspace, team leaderboard, manager dashboard |

### Key Differentiators
- Exam prep mode (UPSC, JEE, NEET, SSC, Banking) — 30M aspirants market
- Offline-first — critical for India (poor connectivity)
- Hindi + regional languages — UI in user's language
- Spiritual features — vrat, pooja, Ayurveda (Phase 3)
- India-tuned pricing — ₹49/mo Pro, ₹999 lifetime
- WhatsApp-first sharing — viral organic growth loop
- AI coach (Claude API) — personalized, not generic (Phase 3)
- Corporate wellness B2B — ₹199/seat/month

### Overall Success Metrics (All Phases)

| Phase | MAU | ARR | Retention |
|---|---|---|---|
| Phase 1 (MVP) | 50K downloads | — | 45% D7 · 4.3+ stars |
| Phase 2 (Growth) | 150K MAU | ₹50L | 30% Day-60 |
| Phase 3 (Intelligence) | 300K MAU | ₹1.4Cr | 35% Day-90 · NPS ≥50 |
| Phase 4 (Ecosystem) | 600K+ MAU | ₹5Cr+ | 500+ enterprises · 1,000+ API devs |

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 OBJECTIVE</h2>

**Timeline:** Weeks 9–18 (10 weeks, 5 sprints)  
**Prerequisites:** Phase 1 live with 50K+ downloads and real user data  
**Do NOT start Phase 2 until Phase 1 is live** — Phase 2 builds on real user feedback  
**Top-Level Targets:** 150K MAU · ₹50L ARR (₹40L consumer + ₹10L B2B) · 30% Day-60 retention  
**Specific Sub-Metrics:**
- MAU: 50K → 150K (3×) · DAU: 10K → 30K
- Pro conversion: 8% of MAU = 1,200 paying users · Lifetime sales ₹25–30L
- WhatsApp sharing ≥ 40% of DAU · Friend add rate ≥ 30% new users
- Weekly challenge completion ≥ 70% active users
- Corporate: ≥ 5 accounts with 50+ employees each · B2B ARR ₹10L+
- Sync reliability 99.9% · Payment success ≥ 98%

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 FEATURES</h2>

### FS1: Cloud Sync & Account (Optional Sign-up)
- **Must:** Email + Google + Apple Sign-In · local mode remains free forever · real-time cross-device sync (iOS, Android) · account recovery · local→cloud data migration on first login (Phase 1 SQLite data bulk-uploads to Supabase) · conflict resolution (latest-write-wins + notify user)
- **Must:** UPI Autopay (Razorpay, GPay, PhonePe, Paytm)
- **Nice:** privacy toggle (local ↔ cloud anytime) · E2E encryption for sensitive data

### FS2: Deep Analytics
- **Must:** goal vs actual chart · time-of-day heatmap · category breakdown (pie) · trend analysis (WoW per activity) · best/worst day of week · subject-wise progress (exam mode) · weekly completion %
- **Nice:** monthly styled PDF report · CSV/JSON export · predictive insights ("at current pace, syllabus done by [date]")

### FS3: WhatsApp-First Social
- **Must:** shareable streak cards (9:16 for WhatsApp status) · shareable weekly summary graphic · invite-friends link (WhatsApp) · friends leaderboard (streaks + XP, not activity details) · weekly friend challenges (beat my weekly XP)
- **Nice:** group chat invite · friend accountability partner (notified if they miss a day)

### FS4: Gamification Full
- **Must:** XP/points (10 XP per activity, +50 streak-day bonus) · level system (levels 1–50 by cumulative XP) · weekly auto-challenges (suggested from user's weak spots)
- **Nice:** seasonal cricket-themed quests · festival themes (Diwali/Holi/Eid auto-apply) · leaderboard tiers (bronze/silver/gold)

### FS5: Platform Enhancements
- **Must:** home screen widget (today's completion ring + next activity) · Apple Health sync (steps, workout minutes) · Google Fit sync
- **Nice:** lock screen widget (iOS 16+) · Siri/Google Assistant voice commands

### FS6: India-Tuned Monetization

| Tier | Price | Activities | Analytics | Friends | Cloud Sync | Other |
|---|---|---|---|---|---|---|
| **Free** | ₹0 | ≤7 | 30 days | ≤3 | ✗ | minimal ads |
| **Pro** | ₹49/mo or ₹399/yr | ∞ | ∞ | ∞ | ✓ | all themes, ad-free, CSV export, priority support |
| **Lifetime Pro** | ₹999 one-time | Everything Pro forever | | | ✓ | IAP, limit 1/user |
| **Family** | ₹299/mo (≤5 members) | All Pro per member | | | ✓ | shared challenges + family analytics |
| **College discount** | 50% off Pro (₹24.50/mo) | with .edu email verification | | | ✓ | |

### FS7: Corporate Wellness (B2B)
- **Must:** admin dashboard · team workspace (≤500 members) · team leaderboard (weekly/monthly XP) · manager dashboard (anonymized HR metrics) · custom team challenges · bulk CSV email invite · monthly wellness PDF · Google Workspace SSO
- **Nice:** Slack bot · Google Calendar sync · aggregated employee wellness insights
- **Pricing:** ₹199/seat/month (min 10 seats) · Target: TCS, Infosys, Wipro, HCL, Accenture, Cognizant (5 pilot accounts)

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 TECH STACK (Cumulative)</h2>

| Layer | Technology |
|---|---|
| Framework | React Native (Expo 51 / RN 0.74) |
| State | Zustand + React Query |
| Local DB | SQLite (expo-sqlite) — remains as offline cache |
| Cloud DB | Supabase PostgreSQL |
| Auth | Supabase Auth (email + Google + Apple Sign-In) |
| API | Node.js + Supabase Edge Functions |
| Sync | Bi-directional SQLite ↔ Supabase sync |
| Payments | Razorpay (UPI Autopay, cards, wallets) |
| Localization | i18next (hi, en, ta, te, bn) |
| UI | React Native Paper + custom components |
| Build | EAS Build |
| CI/CD | GitHub Actions |
| Crash | Sentry |
| Analytics | PostHog |
| Monitoring | Sentry (backend) |

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 DATABASE SCHEMA (New Tables — Supabase PostgreSQL)</h2>

All existing Phase 1 SQLite tables remain. Phase 2 adds these PostgreSQL tables on Supabase:

```sql
-- users (mirrors Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_picture_url TEXT,
  phone TEXT,
  auth_provider TEXT NOT NULL,           -- "email","google","apple"
  is_local_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  notification_enabled BOOLEAN DEFAULT true,
  bio TEXT,
  profile_visibility TEXT DEFAULT 'private', -- "private","friends","public"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- friends
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',         -- "pending","accepted","blocked"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- leaderboards
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL,        -- "weekly","monthly","all_time"
  xp_total INTEGER DEFAULT 0,
  rank INTEGER,
  week_start TEXT,                       -- YYYY-MM-DD (Monday)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,          -- "weekly_auto","friend","team"
  activity_id UUID,
  target_count INTEGER NOT NULL,
  target_metric TEXT NOT NULL,           -- "days","hours","activities"
  status TEXT DEFAULT 'active',          -- "active","completed","failed"
  xp_reward INTEGER DEFAULT 50,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- shares
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,            -- "streak_card","weekly_summary","achievement"
  content_data JSONB,
  share_platform TEXT,                   -- "whatsapp","instagram","twitter"
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL,       -- "pro_monthly","pro_yearly","lifetime","family","college"
  razorpay_subscription_id TEXT,
  status TEXT DEFAULT 'active',          -- "active","cancelled","expired"
  amount_paid REAL,                      -- INR
  billing_cycle TEXT,                    -- "monthly","yearly","one_time"
  start_date DATE,
  renewal_date DATE,
  cancel_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_workspaces
CREATE TABLE team_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  admin_user_id UUID REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 500,
  status TEXT DEFAULT 'active',          -- "active","paused","archived"
  company_name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',            -- "admin","member"
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- team_challenges
CREATE TABLE team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_workspaces(id) ON DELETE CASCADE,
  challenge_name TEXT NOT NULL,
  description TEXT,
  target_count INTEGER,
  target_metric TEXT,                    -- "steps","days","hours"
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',          -- "active","completed","cancelled"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- analytics_daily
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activities_logged INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  activities_skipped INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  mood_rating SMALLINT,                  -- 1-5, populated Phase 3
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Cloud mirrors of Phase 1 entities (for sync)
CREATE TABLE cloud_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  local_id INTEGER,                      -- SQLite id from Phase 1
  name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  frequency TEXT,
  target_duration INTEGER,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cloud_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES cloud_activities(id),
  log_date DATE NOT NULL,
  duration_minutes INTEGER,
  quantity REAL,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (enable on all tables)
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
```

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 API SPECIFICATION</h2>

### Auth
```
POST /api/auth/signup           { email, password } -> { user_id, token }                 (409 if exists)
POST /api/auth/signin           { email, password } -> { user_id, token, user{...} }      (401 if wrong)
POST /api/auth/signin-google    { google_id_token } -> { user_id, token, user{...} }
POST /api/auth/signin-apple     { apple_id_token }  -> { user_id, token, user{...} }
POST /api/auth/logout           Bearer -> { success }
POST /api/auth/refresh-token    { refresh_token }   -> { token, refresh_token }
```

### Cloud Sync (Bearer required)
```
POST /api/sync/activities       { activities:[...] } -> { synced_count, conflicts:[] }
GET  /api/sync/activities       ?since=timestamp     -> [{ id, name, ... }]
POST /api/sync/activity-logs    { logs:[...] }       -> { synced_count }
GET  /api/sync/activity-logs    ?since=timestamp     -> [{ ... }]
```

### Analytics (Bearer required)
```
GET /api/analytics/summary      ?start_date&end_date -> { total, completed, completion_rate, xp, best_day, worst_day }
GET /api/analytics/heatmap      ?period=week|month   -> { heatmap:[{ date, intensity, activities }] }
GET /api/analytics/time-of-day                       -> { distribution:[{ hour, activity_count, pct }] }
GET /api/analytics/category-breakdown                -> { categories:[{ name, hours, pct }] }
GET /api/analytics/subject-progress                  -> { exam_type, subjects:[{ name, completion, study_hours }] }
```

### Social (Bearer required)
```
POST   /api/friends/add                  { friend_username } -> { friend_id, status:"pending" }
GET    /api/friends                      -> [{ user_id, display_name, streak_days, xp_total, status }]
POST   /api/friends/:friend_id/accept   -> { friend_id, status:"accepted" }
DELETE /api/friends/:friend_id          -> { success }
GET    /api/leaderboard/weekly          ?team_id? -> [{ rank, user_id, display_name, xp, streak_days }]
GET    /api/leaderboard/monthly         -> [{ rank, ... }]
```

### Challenges (Bearer required)
```
POST /api/challenges/friend-challenge        { friend_user_id, activity_id, target_days } -> { challenge_id }
GET  /api/challenges/my-active               -> [{ challenge_id, type, target, progress, xp_reward }]
POST /api/challenges/:id/complete            -> { challenge_id, status:"completed", xp_awarded }
```

### Shares (Bearer required)
```
POST /api/shares/streak-card     { activity_id }   -> { image_url, share_link }
POST /api/shares/weekly-summary  -> { image_url, text }
POST /api/shares/track           { share_id, platform } -> { tracked:true }
```

### Subscriptions (Bearer required)
```
POST /api/subscriptions/create           { plan, razorpay_payment_id } -> { subscription_id, status:"active", renews_at }
GET  /api/subscriptions/my-subscription -> { plan, status, renews_at, features:[] }
POST /api/subscriptions/cancel          -> { subscription_id, status:"cancelled" }
```

### Team Workspace (Bearer required)
```
POST /api/teams/create                { team_name, company_name } -> { team_id, admin_user_id }
GET  /api/teams/:team_id              -> { team_id, team_name, member_count, members:[], challenges:[] }
POST /api/teams/:team_id/invite       { emails:[...] } -> { invited_count }              [admin only]
POST /api/teams/:team_id/join         { invite_code }  -> { team_id, role:"member" }
GET  /api/teams/:team_id/leaderboard  -> [{ rank, user_id, display_name, xp, streak_days }]
POST /api/teams/:team_id/challenges   { name, target_count, metric, end_date } -> { challenge_id } [admin only]
GET  /api/teams/:team_id/analytics    -> { engagement, avg_completion_rate, top_performers:[] } [admin only]
```

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 SPRINT BREAKDOWN</h2>

<h3 style="color:#2E7D32;">Sprint 1 (Weeks 9–10): Auth + Cloud Sync Foundation</h3>

<h4 style="color:#2E7D32;">BA TASKS</h4>

1. Write user stories for:
   - Email sign-up / sign-in
   - Google Sign-In (OAuth)
   - Apple Sign-In (iOS only)
   - "Continue without account" (local-only mode stays free)
   - Phase 1 data migration: first login auto-uploads local SQLite data to Supabase
   - Bi-directional sync: changes on device A → appear on device B
   - Conflict resolution: same activity edited offline on 2 devices → latest timestamp wins + notify user

2. Define migration contract:
   - On first login: read all `activities`, `activity_logs`, `streaks`, `badges`, `exam_prep`, `exam_logs` from SQLite → bulk upsert to Supabase cloud tables
   - If cloud data already exists (returning user): merge with conflict resolution
   - Local SQLite continues to work as cache — never deleted

3. Acceptance criteria:
   - Local-only users never forced to sign up
   - Sign-up < 5 taps
   - Migration zero data loss (100% verified)
   - Offline sync queue: changes made offline → synced when online

<h4 style="color:#2E7D32;">PM TASKS</h4>

1. Sprint 1 board: auth + sync tasks, estimates, owners
2. Supabase project setup checklist (DB, Auth, Storage, RLS)
3. Risk: cloud sync conflicts → document conflict resolution policy

<h4 style="color:#2E7D32;">DEV TASKS</h4>

1. Set up Supabase project:
   - Create project (PostgreSQL + Auth + Storage)
   - Run Phase 2 migration SQL (all tables above)
   - Enable RLS on all tables
   - Configure Auth providers (email, Google, Apple)

2. Implement Supabase Auth in React Native:
   - `@supabase/supabase-js` client setup
   - Email sign-up/sign-in screens
   - Google OAuth (expo-auth-session)
   - Apple Sign-In (expo-apple-authentication)
   - Persist session to secure storage (expo-secure-store)
   - "Continue without account" option always visible

3. Implement local→cloud migration service:
   - `migrationService.ts`: on first login, read all Phase 1 SQLite tables → batch upsert to Supabase
   - Show migration progress UI ("Syncing your data... 47/120 activities")
   - Verify: count records before and after migration match

4. Implement bi-directional sync:
   - `syncService.ts`: pull changes since `last_sync_timestamp` → apply to local SQLite
   - Push local changes (insert/update/delete) → apply to Supabase
   - Conflict resolution: compare `updated_at` timestamps → keep latest
   - Offline queue: when no network → queue changes in SQLite `sync_queue` table → flush on reconnect

5. Set up Supabase backend infrastructure:
   - Edge Functions for sync endpoints
   - Environment variables in EAS secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

<h4 style="color:#2E7D32;">QA TASKS</h4>

1. Write 20 test cases:
   - TC01: Sign-up with email → user created in Supabase Auth
   - TC02: Sign-in with Google → OAuth flow completes, session persisted
   - TC03: "Continue without account" → local-only mode, no auth required
   - TC04: First login → all Phase 1 data migrated, zero loss
   - TC05: Sync on 3G → changes appear on second device within 30s
   - TC06: Offline → make changes → come online → changes synced
   - TC07: Conflict → edit same activity on 2 devices offline → latest timestamp wins
   - TC08: Sign out → local data retained → sign back in → cloud data re-synced
   - TC09: RLS → user A cannot read user B's data
   - TC10–TC20: Additional auth + sync edge cases

2. Test on 3G throttled network (Chrome DevTools / Android network shaping)
3. Test migration with 500+ activities and 2,000+ logs (stress test)

<h4 style="color:#2E7D32;">DEVOPS TASKS</h4>

1. Supabase project created with all Phase 2 tables + RLS enabled
2. GitHub Actions: add Supabase migration CI step (run `supabase db push` on develop merge)
3. Sentry backend error tracking for Supabase Edge Functions
4. EAS secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

<h4 style="color:#2E7D32;">Sprint 1 Acceptance Criteria</h4>

- ✓ Sign-up/in via email + Google + Apple working
- ✓ Local data auto-migrates on first login (zero loss)
- ✓ Bi-directional sync working on WiFi and 3G
- ✓ Conflict resolution graceful (user notified)
- ✓ Offline queue flushes correctly when online
- ✓ Local-only users unaffected (no forced sign-up)

---

<h3 style="color:#2E7D32;">Sprint 2 (Weeks 11–12): Deep Analytics</h3>

<h4 style="color:#2E7D32;">BA TASKS</h4>

1. User stories for: goal vs actual chart, time-of-day heatmap, category breakdown, WoW trend, subject-wise progress (exam mode), weekly completion %, CSV/PDF export

2. Define analytics data accuracy rules:
   - Goal = `activities.target_duration` × frequency per week
   - Actual = sum of `activity_logs.duration_minutes` for period
   - Completion rate = completed / (completed + missed) × 100
   - WoW trend = (this week total − last week total) / last week total × 100

<h4 style="color:#2E7D32;">PM TASKS</h4>

1. Sprint 2 board: analytics + export tasks, estimates, owners, dependencies (analytics aggregation must be done before UI)
2. PRD for "Deep Analytics Feature": problem (users have no visibility into habit patterns), solution (goal vs actual + heatmap + trends), success metrics (chart load < 1s, accuracy 100%, CSV export used by ≥20% Pro users)
3. Risk register update: query performance on large datasets (>365 days) — mitigation: indexed queries + pagination

<h4 style="color:#2E7D32;">DEV TASKS</h4>

1. Build analytics aggregation service:
   - Daily job: aggregate `activity_logs` → populate `analytics_daily` table
   - Query optimizations: indexes on `user_id, date`

2. Implement analytics UI screens (react-native-chart-kit or Victory Native):
   - Goal vs Actual bar chart (weekly)
   - Time-of-day heatmap (24 × 7 grid)
   - Category breakdown pie chart
   - WoW trend line chart per activity
   - Subject-wise progress bars (exam mode)

3. Implement CSV export (Pro feature):
   - Export all logs for a date range → `activity_logs_[date].csv`
   - Share via RN Share API

4. Implement PDF report (Pro feature):
   - Weekly summary PDF with charts + key metrics
   - Generated using `react-native-html-to-pdf`

<h4 style="color:#2E7D32;">QA TASKS</h4>

1. Accuracy spot-check: manually sum logs for a week → verify chart shows same number
2. Charts render < 1s with 365 days of data
3. CSV export: valid format, all columns present
4. PDF: readable on all device sizes
5. No stale data: analytics refresh daily (not using yesterday's cache for today)

<h4 style="color:#2E7D32;">Sprint 2 Acceptance Criteria</h4>

- ✓ Goal vs actual chart accurate
- ✓ Category breakdown sums to 100%
- ✓ Time-of-day heatmap correct
- ✓ WoW trends accurate
- ✓ Charts render < 1s
- ✓ CSV + PDF export working (Pro only)
- ✓ No mobile/cloud data discrepancies

---

<h3 style="color:#2E7D32;">Sprint 3 (Weeks 13–14): WhatsApp-First Social + Friends</h3>

<h4 style="color:#2E7D32;">BA TASKS</h4>

1. User stories for: streak card generation, weekly summary card, WhatsApp share, add friend, friends leaderboard, friend challenge, weekly auto-challenge generation

2. Streak card design spec:
   - 9:16 format (1080×1920px or 540×960px)
   - Shows: activity name, streak count, badge earned, user display name
   - Branded with Daily Activity Tracker logo
   - Language-aware text

<h4 style="color:#2E7D32;">PM TASKS</h4>

1. Sprint 3 board: social + sharing + challenges + XP tasks, estimates, owners
2. PRD for "WhatsApp-First Social": problem (users lack social motivation), solution (streak cards + friends leaderboard + challenges), success metrics (WhatsApp share rate ≥ 40% of DAU, friend add rate ≥ 30% new users)
3. Risk register update: friend challenge fairness (users with more free time dominate) — mitigation: relative improvement scoring option
4. W14 outreach prep: identify 10 pilot B2B companies to contact in Sprint 5

<h4 style="color:#2E7D32;">DEV TASKS</h4>

1. Implement streak card generator:
   - Use `react-native-view-shot` to capture card view as image
   - Share via `expo-sharing` or `react-native-share`
   - WhatsApp opens chat selection with card pre-attached

2. Implement friends flow:
   - Add friend by username or phone number
   - Friend request → accept/decline
   - Friends list with streak + XP shown
   - Friends leaderboard (ranked by weekly XP)

3. Implement friend challenges:
   - Create challenge: pick friend, pick activity, set target days
   - Track progress for both users
   - XP reward on completion
   - Notification: "Priya challenged you to a 7-day gym streak!"

4. Implement weekly auto-challenges:
   - Every Sunday: generate challenge from user's weakest activity
   - Auto-challenge active for 7 days
   - Completion: +50 XP, badge possible

5. Implement XP system:
   - +10 XP per activity logged
   - +50 XP per streak day (day 7+)
   - Level = floor(sqrt(cumulative_xp / 100)) (Level 1–50)
   - Level-up animation

<h4 style="color:#2E7D32;">QA TASKS</h4>

1. Streak card tests: correct on various screen sizes, WhatsApp opens on iOS + Android
2. Friends features tested with 2 real devices
3. Challenge progress logic verified
4. XP calculation spot-checked
5. Auto-challenge generates every Sunday (test with mocked date)

<h4 style="color:#2E7D32;">Sprint 3 Acceptance Criteria</h4>

- ✓ 9:16 streak cards generate correctly
- ✓ WhatsApp share opens chat selection
- ✓ Friends leaderboard ranked correctly
- ✓ Friend challenge tracks progress for both users
- ✓ XP earned per log, level-up animation triggers
- ✓ Auto-challenges generate weekly

---

<h3 style="color:#2E7D32;">Sprint 4 (Weeks 15–16): Monetization + Gamification Full</h3>

<h4 style="color:#2E7D32;">BA TASKS</h4>

1. User stories for: Pro upgrade flow, Lifetime purchase, UPI Autopay recurring, college discount with .edu verification, feature gating (free vs Pro), XP level-up, seasonal quests

2. Feature gate matrix:
   - Free: ≤7 activities, 30-day analytics, ≤3 friends, 1 active challenge, no cloud sync, minimal ads
   - Pro: unlimited everything, cloud sync, CSV export, all themes, ad-free, priority support
   - Lifetime Pro: same as Pro, forever, one-time IAP
   - Family: Pro for 5 members + shared challenges + family analytics

<h4 style="color:#2E7D32;">PM TASKS</h4>

1. Sprint 4 board: Razorpay integration + subscription plans + feature gating + gamification tasks
2. PRD for "India-Tuned Monetization": pricing rationale (₹49/mo = 1 cup chai/day), conversion targets (8% of MAU), Razorpay as payment backbone for India
3. W15 in-app announcement copy: "Pro tier launching — early bird pricing"
4. W16 email draft to Phase 1 user base: early-bird Pro offer + lifetime deal (limited 500)
5. Risk register update: App Store IAP fee (30%) for iOS — mitigation: push Razorpay web payment as primary, App Store as fallback

<h4 style="color:#2E7D32;">DEV TASKS</h4>

1. Implement Razorpay payment integration:
   - Install `react-native-razorpay`
   - Configure Razorpay key from EAS secrets
   - UPI Autopay (GPay, PhonePe, Paytm) for monthly subscriptions
   - Payment success → call `/api/subscriptions/create` → unlock Pro features
   - Razorpay webhook: handle payment failures, renewals, cancellations

2. Implement feature gating:
   - `subscriptionStore.ts`: track current plan + features
   - Gate UI: blur/lock Pro features with "Upgrade" CTA
   - Ads: show banner ads (AdMob) for free tier users → hide for Pro

3. Implement subscription management screen:
   - Current plan, next renewal date
   - Upgrade options (Pro, Lifetime, Family)
   - Cancel subscription with retention offer
   - College discount: verify .edu email → apply 50% discount

4. Implement seasonal quests (cricket-themed):
   - Quest: "IPL Season — log 10 fitness activities this week" → +200 XP
   - Unlocks at Phase 2 launch, refreshes every IPL season

5. Implement app themes:
   - Default, Dark, Saffron (Diwali), Green (Eid), Blue (Cricket)
   - Unlock by milestones (30-day streak unlocks Dark, etc.)

<h4 style="color:#2E7D32;">QA TASKS</h4>

1. E2E payment test (Razorpay sandbox):
   - UPI Autopay via GPay sandbox
   - Credit/debit card payment
   - Payment failure → retry logic
2. Feature gating: verify free user cannot access Pro features
3. Subscription state persists across app restart
4. College discount: .edu email verified → 50% off applied
5. Lifetime: limited to 1 per user

<h4 style="color:#2E7D32;">DEVOPS TASKS</h4>

1. Razorpay webhook endpoint deployed on Supabase Edge Functions
2. `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in EAS secrets
3. Webhook signature verification implemented (prevent replay attacks)

<h4 style="color:#2E7D32;">Sprint 4 Acceptance Criteria</h4>

- ✓ Razorpay payment processed (UPI + card)
- ✓ Pro features immediately unlocked after payment
- ✓ Free tier ads visible, hidden for Pro
- ✓ Subscription persists in DB after payment
- ✓ Webhook handles renewals and failures correctly
- ✓ XP + levels + seasonal quests working

---

<h3 style="color:#2E7D32;">Sprint 5 (Weeks 17–18): Corporate Wellness B2B + Platform Features + Launch</h3>

<h4 style="color:#2E7D32;">BA TASKS</h4>

1. User stories for: team workspace creation, bulk CSV invite, team leaderboard, manager dashboard, Google Workspace SSO, home screen widget, Apple Health sync, Google Fit sync

2. B2B pricing + onboarding spec:
   - ₹199/seat/month, minimum 10 seats
   - Admin creates workspace → invites via CSV or email
   - Manager sees anonymized team wellness metrics
   - Monthly PDF wellness report to admin

<h4 style="color:#2E7D32;">PM TASKS</h4>

1. Sprint 5 board: B2B workspace + platform features + launch prep tasks, estimates, owners
2. PRD for "Corporate Wellness B2B Module": problem (HR managers lack wellness visibility), solution (team workspace + anonymized dashboard), pricing (₹199/seat/mo min 10 seats), targets (5 pilot accounts by W18)
3. B2B sales collateral: pitch deck for TCS/Infosys/Wipro/HCL/Accenture/Cognizant pilots
4. Phase 2 App Store listing copy: updated screenshots for social features + Pro tier
5. Go/No-Go checklist preparation for Phase 2 exit gate (Week 18)
6. Risk register update: corporate sales cycle typically 4–8 weeks — start outreach now (W17) to close pilots in Phase 3

<h4 style="color:#2E7D32;">DEV TASKS</h4>

1. Implement team workspace:
   - Create workspace flow: team name, company name, industry, seat count
   - Bulk CSV invite: parse CSV → validate emails → send invites → track acceptance
   - Team leaderboard: real-time weekly XP ranking for team members
   - Admin team challenges: create, track, close

2. Implement manager dashboard:
   - Aggregated metrics only (never individual user data)
   - Team engagement %, average completion rate, top activity categories
   - Monthly wellness PDF generation (admin download)

3. Implement Google Workspace SSO:
   - SAML/OAuth2 with Google Workspace
   - Domain restriction (only @company.com emails)
   - Auto-provision team members from Google Directory

4. Implement home screen widget:
   - iOS Widget (WidgetKit via expo-widgets or native module)
   - Android Widget (App Widget)
   - Shows: today's completion ring + next scheduled activity + streak count
   - Updates every time user logs an activity

5. Implement Apple Health + Google Fit sync:
   - Apple HealthKit: read steps + workout minutes → auto-log as activity
   - Google Fit: read workout sessions → auto-log as activity
   - Sync every 1–2 hours on WiFi (battery-conscious)

<h4 style="color:#2E7D32;">QA TASKS</h4>

1. Team workspace with 100+ members: CSV invite < 10s
2. Real-time leaderboard with 500 team members: load < 1s
3. Manager dashboard: verify no individual user data exposed
4. Google Workspace SSO: test with real G Suite account
5. Widget: updates after activity log
6. Apple Health: steps imported correctly
7. Full Phase 1 + Phase 2 regression (all test cases re-run)

<h4 style="color:#2E7D32;">DEVOPS TASKS</h4>

1. App Store update submission (new screenshots, updated description)
2. TestFlight + Google Play Open Testing beta (2-week soak)
3. B2B monitoring: Sentry team workspace errors
4. Launch checklist:
   - ✓ All Phase 1+2 test cases passed
   - ✓ Zero critical bugs
   - ✓ Payment E2E tested (Razorpay sandbox + production)
   - ✓ Team workspace tested with 100+ members
   - ✓ Privacy policy updated (cloud sync, social features)
   - ✓ Go/No-Go: **GO**

<h4 style="color:#2E7D32;">Sprint 5 Acceptance Criteria</h4>

- ✓ Team workspace ≤500 members functional
- ✓ CSV bulk invite 100+ emails in < 10s
- ✓ Real-time team leaderboard (500+ users) loads < 1s
- ✓ Manager dashboard anonymized (privacy verified)
- ✓ Google Workspace SSO working
- ✓ Home screen widget updates on log
- ✓ Apple Health + Google Fit sync on WiFi
- ✓ All Phase 1+2 regression passed
- ✓ 2-week beta live

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 KEY CONSTRAINTS</h2>

1. **DO NOT FORCE SIGN-UP** — local-only mode must remain free and fully functional forever
2. **ZERO DATA LOSS ON MIGRATION** — Phase 1 SQLite → Supabase migration must be 100% lossless
3. **SYNC RELIABILITY 99.9%** — bi-directional sync must work on 2G/3G, handle conflicts gracefully
4. **PAYMENT SUCCESS ≥ 98%** — Razorpay UPI reliability is critical for India monetization
5. **TEAM LEADERBOARD < 1s** — must scale to 500+ team members without degradation
6. **PRIVACY ABSOLUTE** — manager dashboard never exposes individual user data
7. **OFFLINE FIRST MAINTAINED** — Phase 2 additions must not break Phase 1 offline functionality
8. **APK SIZE** — keep < 20 MB with Phase 2 additions

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 QA STRATEGY</h2>

**In scope:** all Phase 1 features (regression) · auth (email/Google/Apple) · cloud sync (reliability, conflicts, offline queue) · analytics accuracy · social features (friends, leaderboards, challenges) · payments (Razorpay sandbox E2E) · feature gating (free vs Pro) · B2B (team workspace, CSV invite, manager dashboard) · widgets · health integrations · localization (all 5 languages)  
**Environments:** local (Expo Go) · EAS staging (Supabase staging project) · beta (TestFlight + Play Open Testing) · production

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 DEVOPS STRATEGY</h2>

- **Branching:** `main` (prod) · `develop` (staging) · `feature/*` (dev)
- **CI:** PR→develop: lint + test + TypeScript + Supabase migration validation
- **CD:** merge→develop → EAS staging + Supabase staging migration; merge→main → EAS prod + Supabase prod migration
- **Supabase migrations:** version-controlled in `supabase/migrations/` · applied via `supabase db push`
- **Razorpay webhooks:** deployed on Supabase Edge Functions, signature-verified

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 RISK REGISTER</h2>

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Cloud sync conflicts cause data loss | Medium | High | Clear conflict resolution (latest-wins), notify users, prefer local if uncertain |
| 2 | Razorpay failures / UPI issues | Medium | High | Retry logic, JusPay fallback, extensive sandbox testing |
| 3 | Team workspace complexity underestimated | Medium | Medium | Simplify MVP (email invite only; defer Google Workspace SSO to Phase 2.5) |
| 4 | Corporate sales cycle slow | High | Medium | Start B2B outreach Week 14 (early); partner with Pluxee; bundle with health insurance |
| 5 | Health app integrations cause battery drain | Low | Medium | Background sync on WiFi only, 1–2h sync interval max |

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 BUDGET (~₹5,32,500 excl. salary)</h2>

| Item | Cost |
|---|---|
| Infra (Supabase + CDN): ₹17,000/mo × 2.5 months | ₹42,500 |
| Razorpay fees (2% of ₹40L revenue) | ₹80,000 |
| Marketing (influencers × 5 + social + Google Ads) | ₹1,10,000 |
| B2B sales collateral + onboarding | ₹30,000 |
| Localization (Kannada, Marathi, Gujarati, Odia, Punjabi) | ₹2,00,000 |
| Design + legal | ₹70,000 |
| **Total** | **~₹5,32,500** |

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">PHASE 2 EXIT GATE (Week 18 Go/No-Go)</h2>

- ✓ 150K MAU reached (or on trajectory)
- ✓ ₹50L ARR from Pro + B2B subscriptions
- ✓ 30% Day-60 retention
- ✓ Cloud sync working (offline → online, no data loss)
- ✓ WhatsApp share rate ≥ 40% of DAU
- ✓ Razorpay payments live + tested (UPI + card)
- ✓ B2B dashboard functional (5+ pilot companies)
- ✓ All Phase 1+2 test cases passed
- ✓ Zero critical bugs
- ✓ Privacy policy updated for cloud sync + social

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">COMMUNICATION CADENCE</h2>

**Daily standup (10 min):**
```
Yesterday: [completed tasks]
Today:     [planned tasks]
Blockers:  [any issues]
```

**Weekly summary (30 min):** Sprint % complete · bugs found/fixed · performance metrics · revenue metrics (paying users, ARR)

**Biweekly retrospective:** What went well · What to improve · Velocity · Action items

---

<h2 style="color:#2E7D32; border-left:5px solid #2E7D32; padding-left:12px;">READY TO BUILD — PHASE 2, SPRINT 1, WEEK 9</h2>

Context: Phase 1 MVP is live on App Store + Google Play with 50K+ downloads.

Provide immediately:

1. **BA** — User stories for auth (email/Google/Apple), data migration, bi-directional sync, conflict resolution
2. **PM** — Sprint 1 board · Supabase project setup checklist · risk register update
3. **Dev** — Supabase project setup · Phase 2 DB migration SQL · Auth implementation (email/Google/Apple) · Migration service (SQLite → Supabase) · Sync service (bi-directional, offline queue)
4. **QA** — Test plan + 20 test cases for auth + sync
5. **DevOps** — Supabase CI/CD setup · EAS secrets configuration · GitHub Actions update

**Format: production-ready TypeScript code, not pseudocode. No TODOs. All types explicit.**

---
---
---
<h1 style="color:#6A1B9A; border-bottom:3px solid #6A1B9A; padding-bottom:8px;">PHASE 3 PROMPT — Daily Activity Tracker Intelligence (Weeks 19–30)</h1>

> Copy-paste this entire section into Claude Code to begin Phase 3 execution.

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PROJECT BRIEF</h2>

**Project:** Daily Activity Tracker App — Phase 3 Intelligence  
**Client:** Vikas (Founder, Project Management Lead)  
**Target Market:** India (pan-India, Hindi-first)  
**This Phase:** Weeks 19–30 (12 weeks, 6 sprints × 2 weeks)  
**Full Timeline:** 12 months total — Phase 1: 8w · Phase 2: 10w · Phase 3: 12w · Phase 4: 18w  
**Prerequisites:** Phase 2 completed with 150K MAU, ₹50L ARR, stable cloud sync  
**Phase 3 Goal:** 300K MAU · ₹1.4Cr ARR · 35% Day-90 retention · NPS ≥ 50  
**Overall Goal:** Build India's #1 habit tracking + corporate wellness platform (₹5Cr+ ARR by year-end)

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">YOUR ROLES — You Are the Entire Product & Engineering Team</h2>

| Role | Responsibilities |
|---|---|
| **BA** | User stories (Gherkin), journey maps, acceptance criteria, India compliance, cultural sensitivity review for spiritual features |
| **PM** | Sprint boards, PRDs, roadmap, risk register, Premium+ pricing strategy, B2B expansion plan |
| **Dev** | Claude API integration, mood tracking, vrat/fasting, mantra counter, Ayurveda tips DB, smart scheduling, Premium+ gating |
| **QA** | AI feature testing, spiritual content accuracy, Razorpay Premium+ payment testing, cultural appropriateness review |
| **DevOps** | Claude API cost monitoring, Razorpay webhook for Premium+, app store update, EAS Build |

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">HOW YOU WORK</h2>

- Phase-by-phase, sprint-by-sprint (2-week sprints)
- Daily standup: Yesterday / Today / Blockers
- Weekly progress summary: sprint % complete, bugs, AI API costs, Premium+ conversions
- Biweekly retrospective: what went well, what to improve, velocity, action items
- Deliverables: working production code, docs, test cases, deployment configs
- Quality gates: zero critical bugs, all test cases pass before phase exit

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">CORE PRODUCT VISION</h2>

**Daily Activity Tracker** is a mobile-first, offline-first, India-optimized habit tracking app.

### Target Users (Personas)

| Persona | Profile | Goal | Pain Point | Solution |
|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 years | No integrated study tracker | Exam prep mode: subjects, mock logs, study streak |
| **Priya** | 28, IT professional, Delhi | Consistent fitness habit | Forgets to log, wants streak motivation | One-tap logging, streak viz, WhatsApp sharing |
| **Amit** | 35, business owner, Mumbai | Track daily pooja + fasting + yoga | No app respects Hindu practices | Vrat tracker, mantra counter, spiritual badges |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Corporate workspace, team leaderboard, manager dashboard |

### Key Differentiators
- Exam prep mode (UPSC, JEE, NEET, SSC, Banking) — 30M aspirants market
- Offline-first — critical for India (poor connectivity)
- Hindi + regional languages — UI in user's language
- Spiritual features — vrat, pooja, Ayurveda (this phase)
- India-tuned pricing — ₹49/mo Pro, ₹149/mo Premium+, ₹999 lifetime
- WhatsApp-first sharing — viral organic growth loop
- AI coach (Claude API) — personalized, not generic
- Corporate wellness B2B — ₹199/seat/month

### Overall Success Metrics (All Phases)

| Phase | MAU | ARR | Retention |
|---|---|---|---|
| Phase 1 (MVP) | 50K downloads | — | 45% D7 · 4.3+ stars |
| Phase 2 (Growth) | 150K MAU | ₹50L | 30% Day-60 |
| Phase 3 (Intelligence) | 300K MAU | ₹1.4Cr | 35% Day-90 · NPS ≥50 |
| Phase 4 (Ecosystem) | 600K+ MAU | ₹5Cr+ | 500+ enterprises · 1,000+ API devs |

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 OBJECTIVE</h2>

**Timeline:** Weeks 19–30 (12 weeks, 6 sprints)  
**Prerequisites:** Phase 2 live with 150K MAU, ₹50L ARR, stable cloud sync  
**Do NOT start Phase 3 until Phase 2 is live and data is flowing**  
**Targets:** 300K MAU · ₹1.4Cr ARR · 35% Day-90 retention · NPS ≥ 50 · Premium+ at 5% of MAU (15,000 users @ ₹149/mo = ₹2.68Cr ARR) · 100+ corporate accounts

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 FEATURES</h2>

### FS1: AI Weekly Review (Claude API)
- **Must:** automated weekly insight every Monday · pattern detection ("40% more active Tuesdays") · correlation analysis ("sleep < 6h → gym skip 80%") · positive reinforcement (genuine, not generic) · WoW trend analysis · exam subject weak-spot ID ("Constitutional Law needs 2× more study") · insights stored in DB · 24h cache (no duplicate Claude calls) · text-only fallback if API fails
- **Nice:** shareable insight cards (9:16 WhatsApp) · predictive recommendations ("finish UPSC syllabus by [date]") · mood correlation ("mood 30% higher on exercise days")
- **Cost target:** < $0.003/call · < ₹2/user/week

### FS2: AI Coach Nudge (Smart Re-engagement)
- **Must:** miss-streak detection (2+ days missed → AI-generated push notification) · plan recalibration (every Monday, AI adjusts targets based on adherence) · smart timing (AI learns user's receptive window) · exam nudges ("on track / need to focus on [subject]") · 1-tap log action from notification
- **Nice:** friend comparison ("your friend did 5 workouts, you did 2") · streak predictions ("3 more days → 30-day badge")

### FS3: Mood & Wellbeing Tracking
- **Must:** daily mood check-in (1-tap, 5 emoji levels 😞😟😐🙂😄) · energy scale (1–5 mornings) · sleep quality (1–5) · mood-activity Pearson correlation · mood history chart (30 days) · top-3 mood-boosting activities shown
- **Nice:** journal notes (1–2 sentence reflections) · seasonal mood trends · mental health resources link (if consistently low mood)

### FS4: Vrat/Fasting Tracker (Spiritual)
- **Must:** vrat calendar (auto-populate Ekadashi, Karwa Chauth, Navratri, Ramadan, Maha Shivaratri) · fasting log (start/break times) · fasting streak (consecutive Ekadashi fasts) · breaking reminder (alert when vrat ends) · fasting mood correlation
- **Nice:** auspicious time calculator (Brahma Muhurta, Pitru Paksha) · vrat-specific recipes · family vrat tracking

### FS5: Pooja & Mantra Counter (Digital Mala)
- **Must:** mantra counter (flexible: "108 Surya Namaskar", "1000 Om Namah Shivaya") · supported mantras: Om, Gayatri, Hanuman Chalisa, Surya Namaskar, Om Namah Shivaya · pooja streak · pooja history · auspicious time alerts (Brahma Muhurta)
- **Nice:** voice input mantra counting · pooja calendar (festival dates) · shared family pooja

### FS6: Ayurveda & Seasonal Wellness Tips
- **Must:** daily wellness tip (Daadi-maa wisdom: haldi doodh, oil massage, etc.) · seasonal recommendations (summer: cooling, winter: warming) · dosha-based suggestions (Vata/Pitta/Kapha) · 100+ curated tips in DB (seasonal + dosha-tagged) · localized daily tip push notification
- **Nice:** dosha quiz · Ayurveda + mood correlation · regional tips (South India: coconut-based, North India: wheat-based)

### FS7: Smart Scheduling (AI-Powered)
- **Must:** AI schedule builder — user inputs free hours + goals → Claude proposes daily time-block plan · conflict detection · adaptive difficulty (5–10% weekly target increase) · rest day suggestions · optimal timing based on past patterns
- **Nice:** habit stacking ("after breakfast → gym") · multi-day optimization

### FS8: Premium+ Tier

| Tier | Price | Features |
|---|---|---|
| **Free** | ₹0/mo | core tracking (Phase 1 free limits) |
| **Pro** | ₹49/mo or ₹399/yr | unlimited activities, cloud sync, ad-free, CSV export |
| **Lifetime Pro** | ₹999 one-time | everything Pro forever |
| **Premium+** | ₹149/mo or ₹1,490/yr | all Pro + AI weekly review, AI coach, mood tracking, full vrat/pooja, Ayurveda tips, smart scheduling, 24h priority support, early access |
| **Family** | ₹299/mo (5 members) | Pro features for 5 members |

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 TECH STACK (Cumulative)</h2>

| Layer | Technology |
|---|---|
| Framework | React Native (Expo 51 / RN 0.74) |
| State | Zustand + React Query |
| Local DB | SQLite (expo-sqlite) — offline cache |
| Cloud DB | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI | Anthropic Claude API (claude-haiku-4-5 for cost efficiency) |
| Payments | Razorpay (UPI Autopay, Premium+ subscription) |
| Localization | i18next (hi, en, ta, te, bn) |
| UI | React Native Paper + custom components |
| Charts | react-native-chart-kit or Victory Native |
| Build | EAS Build |
| CI/CD | GitHub Actions |
| Crash | Sentry |
| Analytics | PostHog |
| Hindu Calendar | External Hindu calendar API (vrat dates, Tithi) |

> Claude API key stored as Supabase Edge Function secret: `ANTHROPIC_API_KEY`  
> AI calls made from Supabase Edge Functions (never from client — key never exposed)

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 DATABASE SCHEMA (New Tables — Supabase PostgreSQL)</h2>

All Phase 1 + Phase 2 tables remain. Phase 3 adds:

```sql
-- mood_logs
CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_rating SMALLINT NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- fasts
CREATE TABLE fasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vrat_name TEXT NOT NULL,               -- "Ekadashi","Karwa Chauth","Navratri","Ramadan","Maha Shivaratri"
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,                       -- HH:MM
  end_time TIME,                         -- HH:MM
  status TEXT DEFAULT 'planned',         -- "planned","in_progress","completed"
  mood_rating SMALLINT CHECK (mood_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- mantra_logs
CREATE TABLE mantra_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID,
  mantra_name TEXT NOT NULL,             -- "Om","Gayatri","Hanuman Chalisa","Surya Namaskar"
  count INTEGER NOT NULL,
  duration_minutes INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ai_insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_week_start DATE NOT NULL,      -- Monday YYYY-MM-DD
  insight_type TEXT NOT NULL,            -- "weekly_review","pattern","recommendation"
  insight_title TEXT NOT NULL,
  insight_text TEXT NOT NULL,            -- Claude-generated
  insight_data JSONB,                    -- structured data behind the insight
  xp_reward INTEGER DEFAULT 10,
  was_acted_upon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, insight_week_start)
);

-- ai_coach_messages
CREATE TABLE ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,            -- "miss_streak","plan_recalibration","encouragement"
  message_text TEXT NOT NULL,            -- Claude-generated
  triggered_reason TEXT,                 -- "missed_2_days","low_completion","exam_behind"
  was_sent_at TIMESTAMPTZ,
  was_opened BOOLEAN DEFAULT false,
  user_acted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- scheduled_plans
CREATE TABLE scheduled_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_json JSONB NOT NULL,              -- [{ time:"07:00", activity:"Gym", duration:60 }, ...]
  plan_type TEXT DEFAULT 'ai_generated', -- "ai_generated","user_custom"
  status TEXT DEFAULT 'active',          -- "active","archived"
  adherence_rate REAL,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- wellness_tips
CREATE TABLE wellness_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_text TEXT NOT NULL,
  tip_category TEXT NOT NULL,            -- "ayurveda","seasonal","general_wellness"
  season TEXT,                           -- "summer","monsoon","winter","spring"
  dosha TEXT,                            -- "vata","pitta","kapha"
  language TEXT DEFAULT 'en',
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Note: wellness_tips is public read (no RLS user filter — it's a content table)

-- dosha_profiles
CREATE TABLE dosha_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  primary_dosha TEXT NOT NULL,           -- "vata","pitta","kapha"
  secondary_dosha TEXT,
  dosha_determined_via TEXT DEFAULT 'quiz', -- "quiz","admin"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on all user tables
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantra_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosha_profiles ENABLE ROW LEVEL SECURITY;

-- Backfill analytics_daily with mood data
UPDATE analytics_daily ad
SET mood_rating = ml.mood_rating
FROM mood_logs ml
WHERE ad.user_id = ml.user_id AND ad.date = ml.date;
```

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 API SPECIFICATION</h2>

### AI Insights (Premium+, Bearer required)
```
GET  /api/insights/weekly/:week_start  ?week_start=YYYY-MM-DD -> { title, text, insights:[{type,text}], xp_earned }
GET  /api/insights/history             -> [{ week_start, title, viewed_at, acted_upon }]
POST /api/insights/:id/view            -> { insight_id, viewed:true }
POST /api/insights/:id/act             { action_taken } -> { xp_awarded:50 }
```

### AI Coach (Premium+, Bearer required)
```
GET  /api/coach/pending-messages       -> [{ message_id, type, text, triggered_reason }]
POST /api/coach/message/:id/open       -> { message_id, opened:true }
POST /api/coach/message/:id/action     { action:"log_activity"|"dismiss" } -> { action_recorded }
```

### Mood Tracking (Bearer required)
```
POST /api/mood/log                { date, mood_rating:1-5, energy:1-5, sleep:1-5, notes? } -> { mood_log_id }
GET  /api/mood/history/:period    ?period=7d|30d|all -> [{ date, mood, energy, sleep }]
GET  /api/mood/trends             (Premium+) -> { avg_mood, correlations:[{ activity, correlation, sample_size }] }
```

### Vrat/Fasting (auth optional for calendar)
```
GET  /api/vrat/calendar/:year_month  -> [{ vrat_date, vrat_name, description }]
POST /api/vrat/log                   { vrat_name, start_date, start_time, end_date, end_time, mood_rating, notes } -> { fast_id }
GET  /api/vrat/history               -> [{ vrat_name, date, status, mood_rating }]
GET  /api/vrat/streaks               -> { ekadashi_streak, total_fasts }
```

### Mantra Counter (Bearer required)
```
POST /api/mantra/log        { mantra_name, count, duration_minutes, date } -> { mantra_log_id }
GET  /api/mantra/history    -> [{ date, mantra, count, duration }]
GET  /api/mantra/milestones -> [{ milestone, achieved, achieved_date?, progress_pct? }]
```

### Wellness Tips (auth optional)
```
GET /api/wellness/daily-tip      ?date=YYYY-MM-DD -> { tip_text, category }
GET /api/wellness/tips/:category ?season?&dosha? -> [{ tip_id, tip_text, category, season }]
```

### Smart Scheduling (Premium+, Bearer required)
```
POST /api/schedule/generate  { goals:["UPSC study 4h","Gym 1h"], available_hours:7, timezone } -> { schedule:[{time,activity,duration}] }
POST /api/schedule/save      { plan_name, plan_json } -> { plan_id, status:"active" }
GET  /api/schedule/adherence/:plan_id -> { adherence_rate, completed_days, total_days }
```

### Dosha Profile (Bearer required)
```
POST /api/dosha/quiz    { answers:[...] } -> { primary_dosha, secondary_dosha }
GET  /api/dosha/profile -> { primary_dosha, secondary_dosha, tips:[] }
```

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 SPRINT BREAKDOWN</h2>

<h3 style="color:#6A1B9A;">Sprint 1 (Weeks 19–20): AI Weekly Review + Claude API Integration</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. Write user stories for:
   - AI weekly review generation (Premium+ users, every Monday)
   - Viewing weekly insight in-app (insight card with title + body)
   - Sharing insight card on WhatsApp (9:16 format)
   - Insight "acted upon" tracking (user logs activity after reading insight → +50 XP)

2. Define Claude API prompt contract:
   - Input: last 7 days of activity logs (activity name, duration, status, date) + exam logs + streak data
   - Output format: `{ title: string, insights: [{ type: "pattern"|"correlation"|"recommendation", text: string }] }`
   - Language: generate in user's preferred language (hi or en)
   - Tone: encouraging, personal, specific (not generic platitudes)

3. Define cost + caching rules:
   - Generate once per week per user (Monday 6 AM IST)
   - Cache in `ai_insights` table — never call Claude twice for same user+week
   - If Claude fails → show cached last week's insight + "New insight coming soon" message

<h4 style="color:#6A1B9A;">PM TASKS</h4>

1. Sprint 1 board: Claude integration tasks, cost monitoring setup
2. Claude API cost budget: max $0.003/call × estimated weekly active Premium+ users
3. Risk: API costs exceed budget → mitigation: cache + batch + haiku model

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Set up Anthropic Claude API:
   - Store `ANTHROPIC_API_KEY` in Supabase Edge Function secrets
   - Create `generate-weekly-insight` Edge Function (Node.js/Deno)
   - Use `claude-haiku-4-5` model (cost-optimized)
   - Input: fetch user's last 7 days from `analytics_daily` + `activity_logs` + `exam_logs`
   - Output: parse JSON response → save to `ai_insights` table

2. Implement weekly insight cron job:
   - Supabase Scheduled Function (or pg_cron): run every Monday 6 AM IST
   - For each Premium+ user with > 3 activity logs in past 7 days → generate insight
   - Rate limit: max 100 API calls per batch run

3. Implement insight UI:
   - "Your Weekly Review" card on home screen (Monday–Sunday)
   - Insight detail screen: title, body, list of specific insights
   - "Share" button → generate 9:16 card image → WhatsApp share
   - "Mark as acted upon" → +50 XP

4. Implement fallback:
   - If Claude API unavailable → show last week's insight
   - If no past insight → show generic weekly summary (no Claude call)

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. AI integration test with real activity data (verify insight references actual activities)
2. Caching: call generate twice for same user+week → only 1 Claude call made
3. Fallback: simulate API failure → last week's insight shown
4. Cost verification: log API cost per call → verify < $0.003
5. Insight latency: < 5 seconds from tap to insight displayed
6. Hindi insight: verify insight generated in Hindi for Hindi-language users

<h4 style="color:#6A1B9A;">DEVOPS TASKS</h4>

1. `ANTHROPIC_API_KEY` stored in Supabase Edge Function secrets
2. Claude API cost monitoring dashboard (Anthropic console)
3. Alert: Slack/email if monthly Claude cost exceeds $100

<h4 style="color:#6A1B9A;">Sprint 1 Acceptance Criteria</h4>

- ✓ Claude API integration working
- ✓ Insights generated every Monday for Premium+ users
- ✓ Insights reference actual user activity data
- ✓ No duplicate Claude calls in same week for same user
- ✓ Fallback works when API unavailable
- ✓ Cost per call < $0.003 (documented)
- ✓ Insight latency < 5 seconds

---

<h3 style="color:#6A1B9A;">Sprint 2 (Weeks 21–22): Mood & Wellbeing Tracking</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. User stories for: daily mood check-in (emoji), energy logging, sleep quality logging, 30-day mood chart, Pearson correlation display, top-3 mood-boosting activities

2. Define Pearson correlation formula:
   - For each activity: calculate correlation between "days activity logged" vs "mood_rating that day"
   - Sample size minimum: 7 data points before showing correlation
   - Display as: "🏋️ Gym: mood +30% on gym days" or "📚 Study: no significant correlation"

3. Smart timing for mood check-in:
   - Default: 9 PM reminder ("How was your day? 😊")
   - Learn from user: if user consistently logs at 8 PM, shift reminder to 7:45 PM
   - Non-intrusive: dismiss without logging is always allowed

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Implement mood check-in UI:
   - 5-emoji scale (😞😟😐🙂😄) + optional energy (1–5) + sleep (1–5)
   - Single-tap mood logging (< 3 taps total)
   - Animated emoji selection (scale up on select)
   - Saves to `mood_logs` + syncs to Supabase

2. Implement 30-day mood chart:
   - Line chart (mood + energy over 30 days)
   - Color-coded: low mood (red), neutral (yellow), high (green)
   - Tap point to see that day's activities

3. Implement Pearson correlation:
   - `correlationService.ts`: calculate correlation for each activity vs mood
   - Sort by correlation coefficient (highest positive first)
   - Display top 3: "Your mood-boosting activities"

4. Implement mood-triggered insight:
   - If mood < 2 for 3 consecutive days → AI coach message: "I noticed you've been feeling low. Want to try a 10-min walk?" → trigger coach nudge

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. Mood log: all 5 levels save correctly, persist across restart
2. Chart renders with 30 days of data in < 1s
3. Correlation: manually verify for sample user (calculate externally vs app result)
4. Mood-triggered nudge: simulate 3 consecutive low days → verify coach message sent
5. Privacy: mood data not visible to friends/team (verify RLS)

<h4 style="color:#6A1B9A;">Sprint 2 Acceptance Criteria</h4>

- ✓ Daily mood check-in functional (< 3 taps)
- ✓ Data persists + syncs to cloud
- ✓ 30-day chart accurate
- ✓ Pearson correlation correct (verified against manual calculation)
- ✓ Top-3 mood-boosting activities displayed
- ✓ Mood-triggered coach nudge fires correctly
- ✓ No performance issues with large mood datasets

---

<h3 style="color:#6A1B9A;">Sprint 3 (Weeks 23–24): Vrat/Fasting + Pooja/Mantra</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. User stories for: Ekadashi tracking, Karwa Chauth reminder, Navratri logging, Ramadan fasting, mantra counter (flexible count), pooja streak, Brahma Muhurta alert

2. Hindu calendar accuracy requirements:
   - Ekadashi dates: both Shukla and Krishna Paksha (24 per year)
   - Karwa Chauth: one date per year (Kartik Purnima − 9 days)
   - Navratri: both Chaitra and Sharadiya (9 days each, twice a year)
   - Brahma Muhurta: 96 minutes before sunrise, timezone-aware per city
   - Source: integrate with a verified Hindu calendar API (not hardcoded)

3. Cultural sensitivity checklist:
   - All vrat names in original language + transliteration
   - No commercialization of spiritual content
   - Ayurveda tips reviewed by cultural consultant

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Integrate Hindu calendar API:
   - Fetch Ekadashi, Navratri, Karwa Chauth, Maha Shivaratri, Ramadan dates for current + next year
   - Cache in local SQLite + Supabase
   - Display vrat calendar (month view with vrat days highlighted)

2. Implement fasting tracker:
   - Log fast: select vrat name from calendar, set start time, set break time
   - Fasting active indicator (banner on home screen during fast)
   - Break fast reminder (notification at logged break time)
   - Fasting streak: consecutive Ekadashi fasts counted
   - Fasting mood correlation: average mood on fast days vs non-fast days

3. Implement mantra counter (digital mala):
   - Select mantra (Om, Gayatri, Hanuman Chalisa, Surya Namaskar, Om Namah Shivaya)
   - Set target count (108, 1008, custom)
   - Large tap button (count increments on each tap)
   - Progress ring showing count/target
   - Haptic feedback on each count
   - Session complete: save to `mantra_logs`

4. Implement Brahma Muhurta alerts:
   - Calculate Brahma Muhurta (96 min before sunrise) for user's timezone/city
   - Optional notification: "Brahma Muhurta begins at 5:04 AM. Best time for pooja 🙏"
   - Use `expo-location` for city detection (optional, manual city selection fallback)

5. Implement pooja streak:
   - Streak counter for consecutive days with any mantra/pooja logged
   - "365 days of daily pooja" badge

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. Vrat dates: manually verify Ekadashi dates for 2026 against panchangam
2. Brahma Muhurta: spot-check for Delhi, Mumbai, Chennai, Kolkata, Bangalore
3. Mantra counter: count 108 → verify log saved with count=108
4. Fasting streak: miss one Ekadashi → streak resets to 0
5. Festival reminders: test on real device (Android + iOS)
6. Cultural review: spiritual content reviewed by Vikas for accuracy

<h4 style="color:#6A1B9A;">Sprint 3 Acceptance Criteria</h4>

- ✓ Vrat calendar accurate (manually verified)
- ✓ Fasts logged with start/end times
- ✓ Fasting streak counts correctly
- ✓ Mantra counter functional (1, 108, 1008 targets)
- ✓ Brahma Muhurta timezone-aware (tested 5 cities)
- ✓ Pooja streak tracking
- ✓ Festival reminders on real devices

---

<h3 style="color:#6A1B9A;">Sprint 4 (Weeks 25–26): Ayurveda Tips + Smart Scheduling + AI Coach</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. User stories for: daily Ayurveda tip delivery, dosha quiz, dosha-based tip filtering, AI coach miss-streak message, smart schedule generation, schedule adherence tracking

2. Curate 100+ wellness tips for DB:
   - 30 Ayurveda tips (dosha-tagged: vata/pitta/kapha)
   - 20 seasonal tips (summer/monsoon/winter/spring)
   - 20 general wellness (sleep hygiene, hydration, etc.)
   - 10 exam-specific tips (study breaks, concentration foods)
   - 20 spiritual wellness (morning routine, prayer benefits)
   - All in hi + en (100 tips × 2 languages = 200 rows)

3. Dosha quiz questions (5 questions):
   - Body type, digestion, sleep pattern, stress response, skin type
   - Scoring: each answer maps to vata/pitta/kapha point
   - Result: highest score = primary dosha

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Seed `wellness_tips` table with 100+ tips (SQL seed file)

2. Implement daily Ayurveda tip delivery:
   - Select tip based on: current season + user's dosha + user's language
   - Deliver via push notification at 7 AM ("Aaj ki Ayurveda tip: 🌿...")
   - In-app tip card on home screen (dismissible)

3. Implement dosha quiz:
   - 5-question quiz with dosha scoring
   - Result screen: "You are primarily Vata 🌬️" with explanation
   - Save to `dosha_profiles`
   - Tips now personalized to dosha

4. Implement AI coach nudge system:
   - `coachService.ts`: check every 6h for users with 2+ days no activity log
   - Call Claude: "User [X] has not logged for 2 days. Last active: [activity]. Generate a short, warm, personalized re-engagement message in [language]. Max 50 words."
   - Store in `ai_coach_messages` → push notification with 1-tap log action
   - A/B test: 50% humorous tone, 50% serious tone → track which has higher open rate

5. Implement smart scheduling:
   - Schedule generation screen: user inputs goals + free hours
   - Call Claude Edge Function: generate time-block plan
   - Display suggested schedule in timeline UI
   - "Save as my plan" → store in `scheduled_plans`
   - Track adherence: compare plan vs actual logs

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. Tips: verify seasonal correctness (summer tips not shown in winter)
2. Dosha quiz: verify all 3 dosha outcomes reachable
3. AI coach: simulate 2 days no login → verify message generated and sent
4. Schedule generation: test with various inputs (2h free, 8h free, exam vs fitness goals)
5. Schedule: generated in < 5 seconds
6. A/B test tracking: verify assignment is 50/50 and engagement tracked

<h4 style="color:#6A1B9A;">Sprint 4 Acceptance Criteria</h4>

- ✓ 100+ tips seeded in DB, localized in hi + en
- ✓ Daily tip at 7 AM in correct language + season + dosha
- ✓ Dosha quiz functional (all 3 outcomes)
- ✓ AI coach message sent at 2+ days inactive
- ✓ Coach messages personalized (reference user's actual activities)
- ✓ Smart schedule generated in < 5s, no conflicts
- ✓ Adherence rate tracked per plan

---

<h3 style="color:#6A1B9A;">Sprint 5 (Weeks 27–28): Premium+ Tier Launch</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. User stories for: Premium+ purchase flow, 14-day free trial, Premium+ feature gating, renewal, cancellation with retention offer

2. Premium+ feature gate list (everything below gated behind Premium+):
   - AI weekly review
   - AI coach nudges
   - Mood correlation (Pearson) + trends
   - Full vrat tracker (calendar + streak)
   - Mantra counter
   - Ayurveda tips + dosha profile
   - Smart scheduling AI
   - Priority support (24h)
   - Early access to new features

3. Upgrade prompt strategy:
   - When free user taps a Premium+ feature → show upgrade modal
   - Modal: feature name + benefit + "Try free for 14 days" CTA
   - Show social proof: "15,000+ users unlocked this"

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Implement Premium+ Razorpay subscription:
   - New subscription plan in Razorpay dashboard: ₹149/mo, ₹1,490/yr
   - UPI Autopay recurring billing
   - 14-day free trial: subscription created, billing starts after 14 days
   - Webhook: handle trial end (auto-charge or cancel if payment fails)

2. Implement Premium+ feature gating throughout app:
   - `subscriptionStore.ts`: add `isPremiumPlus` computed property
   - Gate all 9 Premium+ features with blur overlay + "Unlock Premium+" CTA
   - Badge: "Premium+" crown icon in user profile

3. Implement subscription management:
   - Subscription status card: "Premium+ · Renews Nov 1, 2026"
   - Cancel: 2-step (confirm → retention offer "Stay for ₹99 this month?") → cancel if declined
   - Upgrade from Pro to Premium+: show price difference

4. Implement 14-day trial:
   - Trial start → all Premium+ features unlocked immediately
   - Day 10 push: "4 days left in your free trial — upgrade to keep access 🌟"
   - Day 14: if no payment method → features lock, gentle reminder

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. E2E payment test (Razorpay sandbox): monthly + annual + trial
2. Feature gating: verify non-Premium+ user sees blur on all 9 features
3. Trial: verify features unlock on day 1, lock on day 15 if no payment
4. Renewal: simulate successful renewal → subscription active
5. Cancellation: retention offer displayed before final cancel

<h4 style="color:#6A1B9A;">DEVOPS TASKS</h4>

1. Razorpay Premium+ plan created in production dashboard
2. New webhook handler for Premium+ trial end + renewal events
3. App store update: add Premium+ to in-app purchase listing

<h4 style="color:#6A1B9A;">Sprint 5 Acceptance Criteria</h4>

- ✓ Premium+ purchase flow working (Razorpay)
- ✓ UPI Autopay recurring billing
- ✓ All 9 Premium+ features gated for non-subscribers
- ✓ 14-day free trial functional
- ✓ Renewal handled automatically
- ✓ Cancellation flow with retention offer

---

<h3 style="color:#6A1B9A;">Sprint 6 (Weeks 29–30): Full Regression + B2B Expansion + Launch</h3>

<h4 style="color:#6A1B9A;">BA TASKS</h4>

1. User onboarding docs: "How AI weekly review works", "How vrat tracking works", "What is a dosha?"
2. Phase 3 App Store screenshots: show AI insight card, mood chart, vrat calendar, mantra counter

<h4 style="color:#6A1B9A;">PM TASKS</h4>

1. Phase 3 marketing collateral: Premium+ launch email to existing Pro users, in-app announcement
2. B2B deck update: "AI wellness insights for corporate teams" pitch
3. Phase 3 go/no-go checklist preparation

<h4 style="color:#6A1B9A;">DEV TASKS</h4>

1. Mood tracking in team analytics (anonymized):
   - Manager dashboard: "Team avg mood this week: 3.8/5 😊" (aggregated, never individual)
   - AI caching: ensure no redundant Claude calls during load testing

2. Performance optimizations:
   - Mood data indexed: `CREATE INDEX ON mood_logs(user_id, date)`
   - AI insights lazy-loaded (not blocking home screen render)

<h4 style="color:#6A1B9A;">QA TASKS</h4>

1. Full regression: all Phase 1 + Phase 2 + Phase 3 test cases
2. Localization QA: all AI-generated content in Hindi + English
3. Cultural appropriateness: Vikas reviews all spiritual content
4. Performance: AI features with 10,000+ mood log entries
5. A/B test tracking: coach message styles verified
6. 2-week beta (TestFlight + Open Testing) with 50+ testers including spiritual users

<h4 style="color:#6A1B9A;">DEVOPS TASKS</h4>

1. App Store update (Phase 3 screenshots + description)
2. Claude API cost monitoring: alert if > ₹20,000/month
3. Launch checklist:
   - ✓ All Phase 1+2+3 regression passed
   - ✓ Zero critical bugs
   - ✓ AI costs within budget
   - ✓ Cultural accuracy sign-off from Vikas
   - ✓ Premium+ payment E2E tested
   - ✓ 2-week beta complete
   - ✓ Go/No-Go: **GO**

<h4 style="color:#6A1B9A;">Sprint 6 Acceptance Criteria</h4>

- ✓ All Phase 1+2+3 features pass regression
- ✓ All 5 languages QA'd
- ✓ AI features working and cost-monitored
- ✓ Premium+ gating verified
- ✓ Spiritual content culturally accurate (Vikas sign-off)
- ✓ App store update live
- ✓ 2-week beta complete

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 MARKETING & LAUNCH STRATEGY</h2>

**Week-by-Week Timeline:**
- **W25:** Tease AI weekly review in-app (visible teaser to free + Pro users — "Coming soon: your personal AI habit coach")
- **W26:** Announce ₹149/mo Premium+ tier via email to all 150K MAU + in-app push notification
- **W27:** Offer 14-day free trial of Premium+ — "Try AI coaching free for 2 weeks"
- **W28:** Full Premium+ launch on App Store + Google Play with updated screenshots

**B2B Expansion (50 → 100 corporate accounts):**
- Pitch AI wellness + mood tracking + personalized insights to enterprise HR teams
- Channels: LinkedIn outreach, HR conferences, Pluxee / Aon / Willis Towers Watson partnerships
- Offer "AI Wellness Dashboard" upgrade to existing 50+ Phase 2 accounts

**Spiritual + Wellness Community:**
- Promote vrat/pooja/Ayurveda features to spiritual communities via Hindi YouTube creators
- Partner with yoga studios, Ayurveda clinics, temple communities
- WhatsApp group marketing (spiritual + wellness groups)

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 KEY CONSTRAINTS</h2>

1. **CLAUDE API COST < $0.003/CALL** — Use claude-haiku-4-5, cache aggressively, never call from client
2. **INSIGHT LATENCY < 5 SECONDS** — Users must not wait > 5s for AI content to load
3. **SPIRITUAL CONTENT ACCURACY** — Vrat dates must be verified against panchangam, cultural consultant review required
4. **MOOD PRIVACY ABSOLUTE** — Mood data never shared with friends or employers without explicit consent
5. **AI COACH NON-INTRUSIVE** — Maximum 1 coach message per day, always dismissible
6. **PREMIUM+ GATING SOLID** — Zero free access to paid features via API or UI bypass
7. **OFFLINE MAINTAINED** — Phase 1+2 offline features must not be broken by Phase 3 additions

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 QA STRATEGY</h2>

**In scope:** all Phase 1+2 regression · Claude API integration · AI content accuracy · mood tracking privacy · vrat date accuracy · mantra counter precision · Premium+ payment (Razorpay sandbox) · feature gating · localization (hi/en) · cultural appropriateness  
**Special:** spiritual content reviewed by native Hindi + cultural consultant before launch  
**Environments:** EAS staging (Supabase staging + Claude API test mode) · beta (TestFlight + Open Testing)

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 RISK REGISTER</h2>

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Claude API costs exceed budget | Medium | High | Cache insights, use haiku model, weekly cost monitoring, fallback to cached content |
| 2 | Vrat/pooja content culturally inaccurate | Low | High | Hindi cultural consultant review, spiritual advisor sign-off, real-user beta |
| 3 | Mood tracking privacy concerns | Medium | Medium | Clear privacy policy, local storage option, no sharing without consent |
| 4 | AI coach messages feel generic | Medium | Medium | A/B test styles, heavy personalization (reference actual activities), weekly iteration |
| 5 | Smart scheduling too complex / underused | Low | Low | Simplify UX, provide templates, guided first-creation flow |

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 BUDGET (~₹4,47,500 excl. salary)</h2>

| Item | Cost |
|---|---|
| Claude API (300K calls/mo × 3 months × $0.003) | ~₹22,500 |
| Infra scaling (DB + analytics × 3 months) | ₹45,000 |
| Localization (Ayurveda tips + vrat/pooja content) | ₹90,000 |
| Marketing (Premium+ launch + B2B + influencer) | ₹1,30,000 |
| Design + content (wellness tips copy + spiritual design) | ₹70,000 |
| Legal (review spiritual/wellness claims + user research) | ₹40,000 |
| Cultural consultant (vrat accuracy + Ayurveda review) | ₹50,000 |
| **Total** | **~₹4,97,500** |

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">PHASE 3 EXIT GATE (Week 30 Go/No-Go)</h2>

- ✓ 300K MAU reached (or on trajectory)
- ✓ ₹1.4Cr ARR (Premium+ conversions + B2B growth)
- ✓ 35% Day-90 retention
- ✓ NPS ≥ 50
- ✓ AI weekly review working in Hindi + English
- ✓ Claude API cost < $0.005/call (optimized)
- ✓ Vrat tracker covers all major Hindu + Muslim fasts
- ✓ Premium+ users > 5% of MAU
- ✓ 100+ corporate accounts
- ✓ All Phase 1+2+3 regression passed
- ✓ Zero critical bugs
- ✓ Cultural accuracy sign-off from Vikas

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">COMMUNICATION CADENCE</h2>

**Daily standup (10 min):**
```
Yesterday: [completed tasks]
Today:     [planned tasks]
Blockers:  [any issues]
```

**Weekly summary (30 min):** Sprint % complete · bugs found/fixed · Claude API costs · Premium+ conversion rate · B2B account count

**Biweekly retrospective:** What went well · What to improve · Velocity · Action items

---

<h2 style="color:#6A1B9A; border-left:5px solid #6A1B9A; padding-left:12px;">READY TO BUILD — PHASE 3, SPRINT 1, WEEK 19</h2>

Context: Phase 2 is live. 150K MAU. ₹50L ARR. Cloud sync stable. Razorpay working.

Provide immediately:

1. **BA** — User stories for AI weekly review, insight sharing, Claude prompt contract, caching rules
2. **PM** — Sprint 1 board · Claude API cost budget · risk register update
3. **Dev** — `generate-weekly-insight` Supabase Edge Function · `ai_insights` DB migration · Insight UI card · Share to WhatsApp · Fallback logic
4. **QA** — Test plan + 20 test cases for AI integration
5. **DevOps** — `ANTHROPIC_API_KEY` secret setup · Claude API cost monitoring · weekly cron job

**Format: production-ready TypeScript code, not pseudocode. No TODOs. All types explicit.**

---
---
---
<h1 style="color:#BF360C; border-bottom:3px solid #BF360C; padding-bottom:8px;">PHASE 4 PROMPT — Daily Activity Tracker Ecosystem (Weeks 31–48)</h1>

> Copy-paste this entire section into Claude Code to begin Phase 4 execution.

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PROJECT BRIEF</h2>

**Project:** Daily Activity Tracker App — Phase 4 Ecosystem  
**Client:** Vikas (Founder, Project Management Lead)  
**Target Market:** India (pan-India) + Global expansion (US/Europe SEA — Phase 5)  
**This Phase:** Weeks 31–48 (18 weeks, 9 sprints × 2 weeks)  
**Full Timeline:** 12 months total — Phase 1: 8w · Phase 2: 10w · Phase 3: 12w · Phase 4: 18w  
**Prerequisites:** Phase 3 completed with 300K MAU, ₹1.4Cr ARR, NPS ≥ 50  
**Phase 4 Goal:** 600K+ MAU · ₹5Cr+ ARR · 500+ enterprise clients · 1,000+ API developers  
**Overall Goal:** Build India's #1 habit tracking + corporate wellness platform (₹5Cr+ ARR by year-end)

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">YOUR ROLES — You Are the Entire Product & Engineering Team</h2>

| Role | Responsibilities |
|---|---|
| **BA** | User stories, API contract specs, enterprise SSO requirements, marketplace creator flow, partnership integration specs |
| **PM** | Sprint boards, PRDs, enterprise sales pipeline tracking, partnership roadmap, developer ecosystem strategy |
| **Dev** | Next.js web app, REST API v1, Zapier/Slack/Google Calendar integrations, Enterprise SSO (SAML), marketplace, South India localization |
| **QA** | Full regression (all 4 phases), API testing (OpenAPI), enterprise UAT, load testing (1M DAU), security penetration testing |
| **DevOps** | Vercel deployment, API monitoring, Supabase scaling, CDN (South India), DR + backup, Datadog/PagerDuty |

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">HOW YOU WORK</h2>

- Phase-by-phase, sprint-by-sprint (2-week sprints)
- Daily standup: Yesterday / Today / Blockers
- Weekly progress summary: sprint % complete, bugs, API usage, enterprise pipeline, revenue
- Biweekly retrospective: what went well, what to improve, velocity, action items
- Deliverables: working production code, docs, test cases, deployment configs
- Quality gates: zero critical bugs, all test cases pass, security sign-off before phase exit

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">CORE PRODUCT VISION</h2>

**Daily Activity Tracker** is a mobile-first, offline-first, India-optimized habit tracking app — expanding into a full ecosystem.

### Target Users (Personas)

| Persona | Profile | Goal | Pain Point | Solution |
|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 years | No integrated study tracker | Exam prep mode: subjects, mock logs, study streak |
| **Priya** | 28, IT professional, Delhi | Consistent fitness habit | Forgets to log, wants streak motivation | One-tap logging, streak viz, WhatsApp sharing |
| **Amit** | 35, business owner, Mumbai | Track daily pooja + fasting + yoga | No app respects Hindu practices | Vrat tracker, mantra counter, spiritual badges |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Enterprise SSO, bulk management, audit logs |

### Key Differentiators
- Exam prep mode (UPSC, JEE, NEET, SSC, Banking) — 30M aspirants market
- Offline-first — critical for India (poor connectivity)
- Hindi + regional languages — UI in user's language
- Spiritual features — vrat, pooja, Ayurveda
- India-tuned pricing — ₹49/mo Pro, ₹149/mo Premium+, ₹999 lifetime
- WhatsApp-first sharing — viral organic growth loop
- AI coach (Claude API) — personalized, not generic
- Corporate wellness B2B — ₹199/seat/month
- Public REST API — developer ecosystem (Phase 4)
- Marketplace — creator programs (Phase 4)

### Overall Success Metrics (All Phases)

| Phase | MAU | ARR | Retention |
|---|---|---|---|
| Phase 1 (MVP) | 50K downloads | — | 45% D7 · 4.3+ stars |
| Phase 2 (Growth) | 150K MAU | ₹50L | 30% Day-60 |
| Phase 3 (Intelligence) | 300K MAU | ₹1.4Cr | 35% Day-90 · NPS ≥50 |
| Phase 4 (Ecosystem) | 600K+ MAU | ₹5Cr+ | 500+ enterprises · 1,000+ API devs |

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 OBJECTIVE</h2>

**Timeline:** Weeks 31–48 (18 weeks, 9 sprints)  
**Prerequisites:** Phase 3 live with 300K MAU, ₹1.4Cr ARR, NPS ≥ 50  
**Do NOT start Phase 4 until Phase 3 is complete**  
**Targets:** 600K+ MAU · ₹5Cr+ ARR · 500+ enterprise customers · 1,000+ API developers · 50+ marketplace programs · 10+ integrations · Web DAU = 25% of total

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 FEATURES</h2>

### FS1: Web Application (Next.js — Feature Parity)
- **Must:** Next.js 14+ web dashboard · full activity CRUD · analytics (goal vs actual, heatmap, trends) · friend management + leaderboards · challenge tracking · subscription management · settings (lang/theme/notifications/privacy) · mood tracking (log + history + charts) · vrat/pooja tracking · AI weekly review display · smart scheduling view/edit · mobile ↔ web real-time sync
- **Nice:** offline PWA (service worker) · desktop push notifications · keyboard shortcuts · bulk activity CSV import · analytics export · weekly email digest
- **Tech:** Next.js 14+ (RSC where beneficial) · Tailwind CSS · Zustand · Supabase PostgreSQL (same backend) · Supabase Auth (same sessions) · Vercel hosting · PostHog · Sentry

### FS2: B2B Enterprise Workspaces
- **Must:** workspace management · member roles (admin/manager/member) · bulk CSV invite (1,000+ employees) · real-time team leaderboard · admin company-wide challenges · manager analytics (anonymized) · department-level reporting · SSO — Google Workspace (SAML) + Microsoft 365 (SAML/OAuth2) + Okta · audit logs · data export (CSV/JSON, compliance)
- **Nice:** Slack/Teams integration · calendar sync · custom branding · white-label option
- **Pricing:** ₹199/seat/mo · volume discounts: 100+ seats = 15% off, 500+ seats = 25% off · annual 20–30% off · custom for 1,000+ seats

### FS3: Third-Party Integrations
- **Must:** Zapier connector (trigger on activity log → actions in 1,000+ apps) · Google Calendar (bi-directional sync) · Notion (push daily summary) · Slack bot (log activity + reminders + leaderboard updates)
- **Nice:** IFTTT · Telegram · Discord · Microsoft Teams · Jira
- **Tech:** documented rate-limited REST API · webhooks (real-time events) · OAuth2 · API key management

### FS4: Public REST API v1
```
[AUTH]       POST /auth/signup · /auth/signin · /auth/refresh
[ACTIVITIES] GET/POST /activities · PATCH/DELETE /activities/:id
[LOGS]       GET/POST /activities/:id/logs · PATCH/DELETE /logs/:log_id
[ANALYTICS]  GET /analytics/summary · /analytics/trends · /analytics/correlation
[SOCIAL]     GET /friends · POST /friends/:id/challenge · GET /leaderboard
[INSIGHTS]   GET /insights/latest · /insights/history
```
- **Docs:** OpenAPI/Swagger · code examples (Python/JS/cURL) · webhook docs · rate limit docs · error handling guide · SDKs: JS, Python, Go
- **Pricing:** Free — 1,000 req/mo · Pro API — $9/mo (10,000 req/mo) · Enterprise — custom (webhooks, priority support)

### FS5: Strategic Partnerships
- **Edtech:** Unacademy (white-label study tracker) · Physics Wallah (co-branded exam prep) · BYJU's
- **Fitness/Wellness:** Cult.fit (sync workouts) · HealthifyMe (nutrition share) · FITTR
- **Corporate/Insurance:** HDFC Ergo (premium discounts for active users) · Star Health · Pluxee
- **Geographic:** regional YouTubers · yoga centers/temples · college CSR programs

### FS6: Marketplace (Programs + Courses)
- **Content:** habit programs ("30-day fitness", "JEE study plan") · wellness courses · live coach programs
- **Monetization:** 70% creator / 30% DAT revenue share · featured placement ₹500–2,000/mo
- **Tech:** creator tools · program builder · enrollment tracking · Razorpay creator payouts

### FS7: South India Geographic Expansion
- **Languages:** Tamil + Kannada (full UI + all content translated)
- **Markets:** Bangalore (IT) · Hyderabad (tech/edtech) · Chennai (fitness/edtech) · Tier 2 (Kochi, Coimbatore, Visakhapatnam)
- **Regional CDN:** lower latency for South India users

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 TECH STACK (Cumulative)</h2>

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo 51 / RN 0.74) |
| Web | Next.js 14+ · TypeScript · Tailwind CSS |
| Web Hosting | Vercel (auto-deploy from GitHub main) |
| State (web) | Zustand |
| Local DB | SQLite (expo-sqlite) — mobile cache |
| Cloud DB | Supabase PostgreSQL |
| Auth | Supabase Auth + SAML (Google Workspace, Microsoft 365, Okta) |
| AI | Anthropic Claude API |
| Payments | Razorpay (mobile) · Stripe (B2B annual contracts) |
| Localization | i18next (hi, en, ta, te, bn, kn) |
| API | Public REST API v1 (Supabase Edge Functions + Express) |
| Integrations | Zapier · Google Calendar API · Slack API · Notion API |
| Build | EAS Build (mobile) + Vercel (web) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry · Datadog · PagerDuty |
| Security | SOC2 audit (W40) · pen-testing (3rd party) · GDPR compliance |

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 DATABASE SCHEMA (New Tables — Supabase PostgreSQL)</h2>

All Phase 1 + Phase 2 + Phase 3 tables remain. Phase 4 adds:

```sql
-- api_keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,         -- SHA-256 hash, never store plain key
  key_name TEXT NOT NULL,
  tier TEXT DEFAULT 'free',              -- "free","pro","enterprise"
  requests_this_month INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000,       -- requests per month
  status TEXT DEFAULT 'active',          -- "active","revoked"
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- api_logs (high-volume — consider partitioning by month)
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now()
);
-- Partition by month for performance:
-- CREATE TABLE api_logs_2026_01 PARTITION OF api_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,        -- "zapier","google_calendar","slack","notion"
  status TEXT DEFAULT 'connected',       -- "connected","disconnected","error"
  external_account_id TEXT,
  auth_token TEXT,                       -- encrypted with Supabase vault
  config JSONB,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- marketplace_programs
CREATE TABLE marketplace_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  program_description TEXT,
  category TEXT NOT NULL,                -- "fitness","study","wellness","spiritual"
  activities JSONB,                      -- [{ name, frequency, duration }]
  duration_days INTEGER,
  price DECIMAL(10,2),                   -- INR (0 = free)
  icon_url TEXT,
  cover_image_url TEXT,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',           -- "draft","published","archived"
  revenue_share_pct INTEGER DEFAULT 70, -- creator gets 70%
  featured BOOLEAN DEFAULT false,
  featured_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- program_enrollments
CREATE TABLE program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES marketplace_programs(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL,
  status TEXT DEFAULT 'active',          -- "active","completed","abandoned"
  progress_pct REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- enterprise_contracts
CREATE TABLE enterprise_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES team_workspaces(id) ON DELETE CASCADE UNIQUE,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  seats_count INTEGER NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL, -- INR
  discount_pct INTEGER DEFAULT 0,        -- 0–30
  total_contract_value DECIMAL(12,2),
  billing_contact TEXT,
  technical_contact TEXT,
  sso_provider TEXT,                     -- "google_workspace","microsoft_365","okta"
  status TEXT DEFAULT 'active',          -- "active","renewal_pending","expired"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Utility functions
CREATE OR REPLACE FUNCTION increment_api_usage(key_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE api_keys SET requests_this_month = requests_this_month + 1, last_used_at = now()
  WHERE id = key_id;
$$;

CREATE OR REPLACE FUNCTION reset_monthly_api_counters()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE api_keys SET requests_this_month = 0;
$$;
-- Schedule reset_monthly_api_counters() via pg_cron on 1st of each month

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_contracts ENABLE ROW LEVEL SECURITY;
```

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 API SPECIFICATION (Public REST API v1)</h2>

### Authentication
```
POST /api/v1/auth/signup            { email, password } -> { user_id, token }
POST /api/v1/auth/signin            { email, password } -> { user_id, token }
POST /api/v1/auth/refresh           { refresh_token }   -> { token, refresh_token }
```

### Activities
```
GET    /api/v1/activities           Bearer -> [{ id, name, category, frequency, ... }]
POST   /api/v1/activities           Bearer { name, category, icon, frequency } -> { activity_id }
PATCH  /api/v1/activities/:id       Bearer { name?, category?, is_archived? } -> { activity }
DELETE /api/v1/activities/:id       Bearer -> { deleted:true }
```

### Logs
```
GET    /api/v1/activities/:id/logs  Bearer ?start_date&end_date -> [{ log_id, date, status, duration }]
POST   /api/v1/activities/:id/logs  Bearer { date, status, duration_minutes, notes? } -> { log_id }
PATCH  /api/v1/logs/:log_id         Bearer { status?, duration_minutes? } -> { log }
DELETE /api/v1/logs/:log_id         Bearer -> { deleted:true }
```

### Analytics
```
GET /api/v1/analytics/summary       Bearer ?start_date&end_date -> { total, completed, completion_rate, xp, best_day }
GET /api/v1/analytics/trends        Bearer ?period=7d|30d|90d  -> [{ date, completed, xp }]
GET /api/v1/analytics/correlation   Bearer (Premium+) -> [{ activity, mood_correlation }]
```

### Social
```
GET  /api/v1/friends                Bearer -> [{ user_id, display_name, streak_days, xp }]
POST /api/v1/friends/:id/challenge  Bearer { activity_id, target_days } -> { challenge_id }
GET  /api/v1/leaderboard            Bearer ?type=weekly|monthly -> [{ rank, user_id, xp, streak }]
```

### Insights (Premium+)
```
GET /api/v1/insights/latest         Bearer (Premium+) -> { week_start, title, text, insights:[] }
GET /api/v1/insights/history        Bearer (Premium+) -> [{ week_start, title, viewed_at }]
```

### Webhooks
```
POST /api/v1/webhooks               Bearer { url, events:["activity.logged","streak.broken"] } -> { webhook_id }
GET  /api/v1/webhooks               Bearer -> [{ webhook_id, url, events, status }]
DELETE /api/v1/webhooks/:id         Bearer -> { deleted:true }
```

### API Key Management
```
POST /api/v1/keys/generate          Bearer { name, tier } -> { key (shown once), key_id }
GET  /api/v1/keys                   Bearer -> [{ key_id, name, tier, requests_this_month, status }]
DELETE /api/v1/keys/:key_id         Bearer -> { revoked:true }
```

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 SPRINT BREAKDOWN</h2>

<h3 style="color:#BF360C;">Sprint 1 (Weeks 31–32): Web App Foundation + Auth + Core</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: web sign-in (Supabase session sharing with mobile), web activity list, web check-off, web dark mode, mobile ↔ web sync
2. Web information architecture: define navigation (sidebar: Activities, Analytics, Friends, Settings, Subscription)
3. Responsive breakpoints: mobile (320px) · tablet (768px) · desktop (1280px+)

<h4 style="color:#BF360C;">PM TASKS</h4>

1. Sprint 1 board: Next.js setup + auth + activity CRUD + sync
2. Vercel project setup checklist
3. Web domain: `app.dailyactivitytracker.com` DNS setup

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Initialize Next.js project:
   ```bash
   npx create-next-app@latest daily-activity-tracker-web --typescript --tailwind --eslint --app
   ```
   Install: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `zustand`, `@tanstack/react-query`

2. Implement Supabase Auth (web):
   - Sign-in page (email + Google + Apple)
   - Session shared with mobile via Supabase JWT (same auth provider)
   - Protected routes via Next.js middleware

3. Implement Activity CRUD (web):
   - Activity list page (same data as mobile, via Supabase)
   - Create/edit activity modal
   - Check-off button (web — no 100ms constraint, but should be fast)
   - Real-time sync: mobile check-off → web updates within 5s (Supabase Realtime)

4. Implement dark mode:
   - Tailwind `dark:` classes
   - System preference detection + manual toggle
   - Persist in user_profiles.theme

5. Vercel deployment:
   - Connect GitHub repo to Vercel
   - Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Auto-deploy on `main` branch push

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Web app live at `app.dailyactivitytracker.com` — verify HTTPS
2. Sign-in: email + Google + Apple (same account as mobile)
3. Mobile check-off → web updates within 5 seconds (Realtime)
4. Responsive: test at 320px, 768px, 1280px, 1920px
5. Dark mode: verify on all pages
6. Page load < 3 seconds (Chrome DevTools Lighthouse)

<h4 style="color:#BF360C;">DEVOPS TASKS</h4>

1. Vercel project created, GitHub connected, auto-deploy configured
2. Environment variables set in Vercel dashboard
3. PostHog + Sentry initialized in Next.js
4. Custom domain: `app.dailyactivitytracker.com` with SSL

<h4 style="color:#BF360C;">Sprint 1 Acceptance Criteria</h4>

- ✓ Web app live at `app.dailyactivitytracker.com`
- ✓ Auth working (login/signup/forgot password)
- ✓ Activity CRUD functional
- ✓ Mobile ↔ web sync (near-real-time)
- ✓ Responsive (320px → 1920px)
- ✓ Dark mode
- ✓ Page loads < 3 seconds

---

<h3 style="color:#BF360C;">Sprint 2 (Weeks 33–34): Web Analytics + Dashboard</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: web analytics dashboard (goal vs actual, heatmap, WoW trends), mood log on web, 30-day mood chart, web leaderboard table, friend challenge progress on web, AI insight card (Premium+)
2. Data parity spec: all charts on web must match mobile data — define acceptable sync lag (< 5 seconds via Supabase Realtime)
3. Desktop UX spec: sidebar navigation, chart sizing (responsive from 768px tablet to 1920px 4K), sortable leaderboard columns

<h4 style="color:#BF360C;">PM TASKS</h4>

1. Sprint 2 board: analytics dashboard + mood web + schedule viewer + leaderboard web — tasks, estimates, owners
2. PRD for "Web Analytics Dashboard": problem (power users want larger screen for habit analysis), solution (full analytics parity on web), success metrics (Web DAU = 25% of total by end of Phase 4)
3. Risk register update: chart rendering performance on large screens with 365+ days of data — mitigation: virtual scrolling + server-side aggregation

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Analytics dashboard (web):
   - Goal vs actual bar chart (recharts or chart.js)
   - Time-of-day heatmap
   - Category breakdown pie chart
   - WoW trends per activity
   - Weekly AI insight card (Premium+)
   - All charts < 2 seconds to render with 365 days of data

2. Mood tracking (web):
   - Log mood (emoji selector) + energy + sleep
   - 30-day mood line chart
   - Correlation display: top-3 mood-boosting activities

3. Smart schedule viewer (web):
   - View active AI-generated schedule
   - Check off time blocks
   - Compare plan vs actual adherence

4. Friends + Leaderboard (web):
   - Friends list
   - Weekly leaderboard table (sortable by XP, streak)
   - Friend challenge progress

<h4 style="color:#BF360C;">QA TASKS</h4>

1. All analytics accurate (match mobile data)
2. Charts < 2s with full year of data
3. Real-time leaderboard: no discrepancy between mobile and web
4. Mood log on web → appears on mobile within 5s

<h4 style="color:#BF360C;">Sprint 2 Acceptance Criteria</h4>

- ✓ Full analytics dashboard on web
- ✓ Charts < 2s
- ✓ Mood tracking functional on web
- ✓ No data discrepancies between mobile and web
- ✓ Real-time leaderboard working

---

<h3 style="color:#BF360C;">Sprint 3 (Weeks 35–36): Public REST API v1 + Documentation</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. Write API contract specs (request/response shapes, error codes) for all endpoints listed above
2. Define rate limiting tiers: Free (1,000/mo), Pro (10,000/mo), Enterprise (custom)
3. Define error response format: `{ error: { code: "RATE_LIMIT_EXCEEDED", message: "...", retry_after: 3600 } }`

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Implement all REST API v1 endpoints (Supabase Edge Functions or Express):
   - Auth endpoints
   - Activities CRUD
   - Logs CRUD
   - Analytics endpoints
   - Social endpoints
   - Insights endpoints (Premium+ gated)
   - Webhooks management
   - API key management

2. Implement API key authentication:
   - Key format: `dat_live_[32-char random]`
   - Hash with SHA-256 before storing
   - On each request: hash incoming key → lookup in `api_keys` → verify status + rate limit
   - Increment `requests_this_month` on each valid request

3. Implement rate limiting:
   - Per-key monthly counter in `api_keys.requests_this_month`
   - Return 429 with `retry_after` header when limit exceeded
   - Reset counters on 1st of month via pg_cron

4. Implement OpenAPI/Swagger documentation:
   - Generate `openapi.json` spec
   - Host Swagger UI at `api.dailyactivitytracker.com/docs`
   - Code examples for every endpoint in Python, JS, cURL

5. Implement webhooks:
   - On activity log: trigger webhook for subscribed users
   - Retry on failure: 3 retries with exponential backoff
   - Webhook verification: HMAC-SHA256 signature in `X-DAT-Signature` header

<h4 style="color:#BF360C;">QA TASKS</h4>

1. All endpoints return correct data (manual + Postman collection)
2. Rate limiting: verify 429 after 1,001st request (Free tier)
3. API key: revoked key returns 401
4. Webhook: fire on activity.logged → verify delivery to test endpoint
5. HMAC signature: verify correct + verify tampered request rejected
6. Swagger docs: all endpoints documented, examples work

<h4 style="color:#BF360C;">DEVOPS TASKS</h4>

1. API subdomain: `api.dailyactivitytracker.com` with SSL
2. API monitoring: Datadog APM (track p99 latency, error rate)
3. Alert: p99 > 500ms OR error rate > 1% → PagerDuty

<h4 style="color:#BF360C;">Sprint 3 Acceptance Criteria</h4>

- ✓ All core API endpoints implemented
- ✓ OpenAPI docs hosted and complete
- ✓ Rate limiting working (429 at limit)
- ✓ API keys hashed in DB (plain key never stored)
- ✓ Webhooks firing with HMAC verification
- ✓ p99 latency < 200ms

---

<h3 style="color:#BF360C;">Sprint 4 (Weeks 37–38): Third-Party Integrations</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: Zapier trigger setup, Google Calendar bi-directional sync, Slack bot commands, Notion daily summary push
2. Integration OAuth flow: user taps "Connect" → OAuth2 → redirect → token stored encrypted in `integrations` table

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Implement Zapier connector:
   - Register as Zapier integration
   - Trigger: "Activity Logged" → sends webhook payload to Zapier
   - Action: "Create Activity Log" → accepts Zapier POST → creates log via API
   - OAuth2 authentication flow

2. Implement Google Calendar bi-directional sync:
   - OAuth2 with Google Calendar API
   - Push: activity scheduled in DAT → create Google Calendar event
   - Pull: Google Calendar event (with #DAT tag) → create activity log
   - Sync every 15 minutes (background job)

3. Implement Slack bot:
   - Slack app with slash commands:
     - `/dat log [activity] [duration]` → creates activity log
     - `/dat streak` → shows current streak in Slack
     - `/dat leaderboard` → shows team leaderboard
   - Daily reminder at user's reminder time (Slack DM)
   - OAuth2: user connects their Slack workspace

4. Implement Notion integration:
   - OAuth2 with Notion API
   - Push daily summary: creates a page in user's Notion workspace with today's activity completion

5. Integration management UI (web + mobile):
   - List of available integrations (Zapier, Google Calendar, Slack, Notion)
   - Connect/disconnect button
   - Last sync timestamp
   - Error indicator if sync failed

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Zapier: trigger fires when activity logged → verify Zapier receives event
2. Google Calendar: activity → calendar event created · calendar event (tagged) → activity log created
3. Slack bot: `/dat log Gym 30` → activity log created, confirmation sent
4. Notion: daily summary page created in connected workspace
5. OAuth2: token refresh works (test with expired token)
6. Disconnect: OAuth token revoked, integration status = "disconnected"

<h4 style="color:#BF360C;">Sprint 4 Acceptance Criteria</h4>

- ✓ Zapier integration live and published
- ✓ Google Calendar real-time bi-directional sync
- ✓ Slack bot responding to all 3 commands
- ✓ Notion daily summary pushing
- ✓ OAuth2 secure (encrypted storage, refresh working)
- ✓ Integration management UI clear and intuitive

---

<h3 style="color:#BF360C;">Sprint 5 (Weeks 39–40): B2B Enterprise (SSO + Bulk + Audit)</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: Google Workspace SSO sign-in, Microsoft 365 SSO sign-in, bulk CSV 1,000+ employees, department hierarchy, audit log viewing (admin), data export (compliance), employee offboarding (deprovisioning)
2. SAML configuration spec: entity ID, ACS URL, attribute mapping (email, display_name, department)

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Implement Google Workspace SSO (SAML):
   - Supabase SAML provider configuration
   - Domain restriction (only @company.com)
   - Auto-provision: new G Suite user → auto-create DAT account + join team workspace
   - SP-initiated SSO flow

2. Implement Microsoft 365 SSO (SAML/OAuth2):
   - Microsoft Azure AD app registration
   - SAML or OAuth2 (whichever M365 prefers)
   - Auto-provision from Azure AD directory

3. Implement Okta SSO (optional, Sprint 5.5):
   - Okta OIDC/SAML connector
   - Same auto-provision pattern

4. Implement bulk CSV import (1,000+ employees):
   - CSV format: `email,name,department,role`
   - Validate: check for duplicates, invalid emails
   - Bulk send invites: rate-limited (50 emails/second)
   - Progress indicator: "Importing 847/1,000 employees..."
   - Complete: "1,000 employees invited. 23 failed (see errors)"
   - Target: 1,000 employees imported in < 5 minutes

5. Implement department hierarchy:
   - CSV field: `department` string
   - Admin can filter leaderboard by department
   - Manager sees only their department's data

6. Implement audit logs:
   - Log all admin actions: member added/removed, challenge created, data exported
   - Table: `audit_logs (id, team_id, actor_user_id, action, target, metadata, created_at)`
   - Admin can view last 90 days of audit logs
   - Export audit log as CSV (compliance)

7. Implement data export (compliance):
   - Admin export: all team activity data as CSV/JSON
   - User data export: individual user's full data (DPDP Act compliance)
   - Deprovisioning: when employee leaves → archive their data, revoke access

<h4 style="color:#BF360C;">QA TASKS</h4>

1. SSO: test with real Google Workspace account (Vikas's Google Workspace test org)
2. SSO: test with real Microsoft 365 account
3. CSV import: test with 1,000 email CSV file → all imported in < 5 min
4. Duplicate handling: re-import same CSV → no duplicates created
5. Audit logs: every admin action appears in audit log
6. Data export: exported CSV/JSON is valid and complete
7. Offboarding: deprovisioned user cannot access team data

<h4 style="color:#BF360C;">DEVOPS TASKS</h4>

1. SAML certificate management for Google Workspace + M365
2. Database: `audit_logs` table partitioned by month
3. Compliance: DPDP Act data residency (India region Supabase)

<h4 style="color:#BF360C;">Sprint 5 Acceptance Criteria</h4>

- ✓ Google Workspace SSO working (tested with real org)
- ✓ Microsoft 365 SSO working
- ✓ CSV 1,000 employees imported in < 5 min
- ✓ Audit logs recording all admin actions
- ✓ Data export valid (compliance)
- ✓ Deprovisioning removes access cleanly

---

<h3 style="color:#BF360C;">Sprint 6 (Weeks 41–42): B2B Advanced Analytics + Manager Dashboard</h3>

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Manager analytics (anonymized):
   - Team engagement % (% of members who logged at least 1 activity this week)
   - Department-level breakdown (Engineering: 72% engagement, HR: 45%)
   - Wellness trends: avg completion rate, mood (Phase 3), activity categories
   - At-risk detection: members with 0 logs in 2 weeks (count only, no names)
   - Top-performer highlights (anonymized: "Top 10% of team: 6.2 avg daily completions")

2. Scheduled email reports:
   - Weekly wellness summary email to admin (every Monday 9 AM)
   - Format: HTML email with key metrics table + trend chart image
   - Admin can configure: frequency (weekly/monthly), recipients

3. Custom report builder:
   - Admin selects date range + metrics + department filter
   - Download as PDF or CSV

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Dashboard: verify no individual user data exposed (privacy critical)
2. Trend calculations: manually verify against raw data
3. Email report: verify delivery on Monday, correct formatting
4. Custom report: various filters → correct output

<h4 style="color:#BF360C;">Sprint 6 Acceptance Criteria</h4>

- ✓ Anonymized manager dashboard (privacy verified — no individual exposure)
- ✓ Department breakdowns accurate
- ✓ Weekly email reports delivered on time
- ✓ Custom report builder working

---

<h3 style="color:#BF360C;">Sprint 7 (Weeks 43–44): Marketplace + Developer Portal</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: browse marketplace programs, enroll in program, track program progress, creator publish program, creator view revenue, developer generate API key, developer view usage
2. Creator program spec: program name, description, category, list of activities (name + frequency + duration), duration_days, price (₹0 = free), cover image

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Implement marketplace frontend (web + mobile):
   - Browse: grid of published programs, filter by category + price
   - Program detail: description, activities list, duration, rating, reviews
   - Enroll: one tap → activities auto-created in user's DAT app
   - Progress: program dashboard showing day-by-day adherence

2. Implement creator tools:
   - Creator dashboard: list my programs, revenue, enrollments
   - Program builder: create/edit program (drag-drop activity list)
   - Publish: submit for review → admin approves → live on marketplace
   - Revenue tracking: 70% of each sale credited to creator monthly

3. Implement marketplace payments:
   - Buyer pays via Razorpay (UPI/card)
   - 70% to creator, 30% to DAT
   - Creator monthly payout via Razorpay payout API

4. Implement developer portal (web):
   - Sign up / sign in (same Supabase auth)
   - Generate API key (shown once in plaintext, then hashed)
   - Usage dashboard: requests this month vs limit, error rate, latency chart
   - Webhook testing tool: trigger test webhook → show payload received
   - Docs link to Swagger UI

5. Implement developer SDKs:
   - JavaScript/TypeScript SDK: `npm install @dat/sdk`
   - Python SDK: `pip install dat-sdk`
   - Go SDK: `go get github.com/dailyactivitytracker/go-sdk`
   - Each SDK: auth, activities, logs, analytics, webhooks

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Marketplace: enroll in program → activities auto-created correctly
2. Creator payout: verify 70/30 split in transaction records
3. Developer portal: generate key → key works for API calls → revoke → key returns 401
4. Webhook tool: test webhook → correct payload received
5. SDK: JavaScript SDK — create activity via SDK, verify in app

<h4 style="color:#BF360C;">Sprint 7 Acceptance Criteria</h4>

- ✓ Marketplace browsable and purchasable
- ✓ Enrollment auto-creates activities
- ✓ 70/30 revenue split tracked
- ✓ Developer portal functional (key gen + usage dashboard)
- ✓ Webhook testing tool working
- ✓ JS SDK published to npm

---

<h3 style="color:#BF360C;">Sprint 8 (Weeks 45–46): Partnerships + South India Expansion</h3>

<h4 style="color:#BF360C;">BA TASKS</h4>

1. User stories for: Unacademy SSO sign-in (white-label study tracker), Cult.fit workout auto-log, HealthifyMe nutrition display on DAT analytics, Tamil UI end-to-end, Kannada UI end-to-end
2. Tamil + Kannada localization spec: 1,200+ strings to translate — string list exported from i18next, professional translation review required, cultural appropriateness check for spiritual strings
3. Regional partnership onboarding spec: yoga studio / temple community partner flow — how they register, what co-branded content they get, revenue share terms

<h4 style="color:#BF360C;">PM TASKS</h4>

1. Finalize partnership agreements: Unacademy (white-label study tracker), Cult.fit (workout sync), HealthifyMe (nutrition share)
2. Co-marketing plan: joint social posts, in-app cross-promotions, revenue share terms
3. South India launch plan: regional influencer campaigns, yoga center partnerships, temple community outreach

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Unacademy white-label integration:
   - Custom branding (logo, colors) for Unacademy-branded version of study tracker
   - SSO: Unacademy account → DAT account (OAuth2)
   - Revenue: Unacademy pays flat monthly fee for white-label

2. Cult.fit workout sync:
   - OAuth2 with Cult.fit API
   - Pull: completed Cult.fit class → auto-log as activity in DAT
   - Push: DAT activity log → notify Cult.fit (if DAT premium + Cult.fit connected)

3. HealthifyMe nutrition share:
   - OAuth2 with HealthifyMe API
   - Pull: HealthifyMe daily nutrition data → show on DAT analytics screen
   - Cross-promotion: DAT shows "Track your nutrition on HealthifyMe" in health category

4. Tamil + Kannada full localization:
   - Add `ta` and `kn` to i18next config
   - Translate all 1,200+ strings into Tamil and Kannada (professional translation)
   - Test: all screens in Tamil — no overflow
   - Test: all screens in Kannada — no overflow

5. South India regional CDN:
   - Configure Supabase with South India region (or CDN node in Bangalore/Chennai)
   - Target: API p99 < 150ms for South India users (vs national 200ms)

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Tamil localization: all screens, no text overflow, cultural review
2. Kannada localization: all screens, no text overflow
3. Cult.fit sync: complete a class → appears in DAT within 5 minutes
4. CDN: measure API latency from Bangalore before/after CDN (target < 150ms)

<h4 style="color:#BF360C;">Sprint 8 Acceptance Criteria</h4>

- ✓ Unacademy white-label live
- ✓ Cult.fit sync working
- ✓ Tamil + Kannada UI complete (no overflow)
- ✓ Regional CDN lowering South India latency
- ✓ Partnership agreements signed

---

<h3 style="color:#BF360C;">Sprint 9 (Weeks 47–48): Final Regression + Load Testing + Launch</h3>

<h4 style="color:#BF360C;">QA TASKS</h4>

1. Full regression: ALL Phase 1 + Phase 2 + Phase 3 + Phase 4 test cases
2. Load testing (1M DAU simulation):
   - Tool: k6 or Locust
   - Simulate 1M DAU: 41,667 concurrent users (assuming 8 active hours/day)
   - Target: API p99 < 200ms, no errors, no data loss under load
   - Supabase connection pooling (pgBouncer) verified
3. Security penetration testing (3rd-party firm):
   - Web app: XSS, CSRF, SQL injection, auth bypass
   - API: injection, rate limit bypass, auth token theft
   - Mobile: certificate pinning, data-at-rest encryption
   - Target: zero critical/high vulnerabilities before launch
4. Enterprise UAT:
   - 2–3 enterprise clients test their SSO + bulk import + manager dashboard
   - Signed UAT acceptance from each client
5. Web Lighthouse score:
   - Performance > 80 · Accessibility > 90 · Best Practices > 90 · SEO > 80

<h4 style="color:#BF360C;">PM TASKS</h4>

1. Phase 4 go/no-go decision framework
2. Ecosystem launch campaigns:
   - REST API: developer community launch (Product Hunt, HackerNews, IndieHackers)
   - Web app: announcement to 600K+ MAU (push + email)
   - Enterprise: sales push to close 50+ new enterprise accounts
   - South India: regional media + influencer launch

<h4 style="color:#BF360C;">DEV TASKS</h4>

1. Performance optimizations based on load test results
2. Any critical/high vulnerability fixes from pen-test
3. Final enterprise UAT bug fixes

<h4 style="color:#BF360C;">DEVOPS TASKS</h4>

1. Infrastructure scaling:
   - Supabase: upgrade to Pro/Team plan if needed (connection limits)
   - Vercel: enable Edge Network for global CDN
   - CDN for static assets (images, fonts): Cloudflare or Fastly
2. Disaster recovery:
   - Daily Supabase DB backup to S3
   - Test restore procedure (monthly)
   - DR runbook documented
3. Production monitoring:
   - Datadog APM: API latency, error rate, throughput
   - PagerDuty: alerts for API error rate > 1% OR p99 > 500ms
   - Sentry: web + mobile + API crash alerts
4. Launch checklist:
   - ✓ All Phase 1–4 regression passed
   - ✓ Load test: 1M DAU no degradation
   - ✓ Pen-test: no critical/high vulnerabilities
   - ✓ Enterprise UAT signed
   - ✓ Web Lighthouse > 80
   - ✓ API p99 < 200ms
   - ✓ DR tested
   - ✓ Monitoring + alerts configured
   - ✓ Go/No-Go: **GO**

<h4 style="color:#BF360C;">Sprint 9 Acceptance Criteria</h4>

- ✓ Full Phase 1–4 regression passed
- ✓ 1M DAU load test: no degradation
- ✓ Pen-test: zero critical/high vulns
- ✓ Enterprise UAT signed off
- ✓ Lighthouse > 80 on all pages
- ✓ DR procedure tested

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 MARKETING & LAUNCH STRATEGY</h2>

**Week-by-Week Launch Timeline:**
- **W43:** Announce partnership ecosystem (Unacademy, Cult.fit, HealthifyMe) — press release + social + email to 300K MAU
- **W44:** Launch Marketplace + Creator Program — "Build and sell your habit program to 300K+ users"
- **W45:** Launch REST API v1 + Developer Program — Product Hunt launch, HackerNews, IndieHackers, developer community
- **W46:** Launch Web App — announcement push to all mobile users, SEO-targeted landing page
- **W47:** Enterprise Sales Push — target 50 new enterprise accounts (TCS, Infosys, HCL, Wipro, Cognizant + 45 more)
- **W48:** South India Regional Launch — Tamil Nadu, Telangana, Karnataka — regional influencers, yoga centers, temple communities, localized pricing

**Growth Levers:**
- API developer community: generous free tier (1,000 req/mo) · hackathon with prizes · SDK examples
- Partnership ecosystem: Unacademy/Cult.fit user acquisition via white-label + cross-promotion
- Enterprise sales: SOC2 + pen-test reports as trust anchors; volume discounts for 100+ / 500+ seats
- Web/desktop penetration: new user segment (professionals who prefer browser over mobile)

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 KEY CONSTRAINTS</h2>

1. **API p99 < 200ms** — public API is a product; latency is a feature
2. **API UPTIME 99.99%** — enterprise clients depend on this; any downtime is a contract issue
3. **SECURITY BEFORE LAUNCH** — pen-test required; no launch with critical/high vulnerabilities
4. **PRIVACY ABSOLUTE (MANAGER DASHBOARD)** — manager dashboard must never expose individual user data, even accidentally
5. **SOC2 AUDIT BY WEEK 40** — enterprise sales require it; start early
6. **GDPR + DPDP ACT** — data residency in India; right to deletion; data export on request
7. **API KEYS NEVER STORED PLAIN** — SHA-256 hash only; shown to user once
8. **OFFLINE MOBILE MAINTAINED** — Phase 1 offline features must still work perfectly
9. **WEB LIGHTHOUSE > 80** — web performance is a proxy for user trust and SEO

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 QA STRATEGY</h2>

**In scope:** all Phase 1+2+3+4 regression · API contract testing (Postman collection) · enterprise SSO (real Google Workspace + M365 accounts) · load testing (1M DAU with k6) · security pen-testing (3rd-party firm) · enterprise UAT · web Lighthouse · localization (Tamil + Kannada added)  
**Environments:** local · EAS staging + Vercel preview · enterprise UAT environment · production

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 DEVOPS STRATEGY</h2>

- **Mobile:** EAS Build + GitHub Actions (same as Phases 1–3)
- **Web:** Vercel auto-deploy on `main` + preview deployments on PR
- **API:** Supabase Edge Functions + Express · API monitoring via Datadog
- **DR:** daily Supabase backup to S3 · monthly restore test · DR runbook in Notion
- **Security:** HTTPS everywhere · API key hashing · OAuth2 token encryption · SAML for SSO

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 RISK REGISTER</h2>

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Web performance lags mobile | Medium | Medium | Mobile-first + progressive enhancement, perf budgets, Lighthouse CI |
| 2 | API misuse / scraping | Medium | Medium | Strict rate limiting, key monitoring, ToS enforcement, abuse detection |
| 3 | Enterprise security audit failures | Low | High | SOC2 audit early (W40), pen-testing, dedicated security docs |
| 4 | Partnership integration complexity | Medium | Medium | Phased rollout (Zapier first), dedicated integration engineer |
| 5 | Slow API developer adoption | Medium | Medium | Generous free tier, developer education, community forum, hackathon |
| 6 | Slow South India expansion | Medium | Low | Partner-led (Unacademy/Cult.fit), regional influencers, localized pricing |

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 BUDGET (~₹25L excl. team salary)</h2>

| Item | Cost |
|---|---|
| Web development (Next.js + Tailwind) | ₹1,50,000 |
| REST API development | ₹50,000 |
| Integrations (Zapier + Slack + Calendar + Notion) | ₹1,00,000 |
| OAuth2 security review | ₹20,000 |
| Enterprise SSO (SAML + M365) | ₹80,000 |
| Audit log + data export | ₹30,000 |
| Developer portal + SDKs | ₹50,000 |
| Security (SOC2 ₹2L + pen-test ₹1L + GDPR ₹50K) | ₹3,50,000 |
| Infra scaling (Supabase ₹90K + CDN ₹30K + monitoring ₹30K) | ₹1,50,000 |
| Marketplace development | ₹80,000 |
| Partnerships + BD (legal ₹2L + sales team 2×4.5mo ₹10L + onboarding ₹2L) | ₹14,00,000 |
| Marketing + launch | ₹3,00,000 |
| South India localization (Tamil + Kannada) | ₹2,00,000 |
| Misc | ₹2,00,000 |
| **Total** | **~₹25L** (+ team salary) |

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">PHASE 4 EXIT GATE (Week 48 Go/No-Go)</h2>

- ✓ 600K+ MAU reached
- ✓ ₹5Cr+ ARR
- ✓ 500+ enterprise clients on B2B plan
- ✓ 1,000+ registered API developers
- ✓ Web app feature-parity with mobile (core flows)
- ✓ Zapier / Slack / Calendar / Notion integrations live
- ✓ Marketplace has 50+ published programs
- ✓ Enterprise SSO live (Google Workspace + M365)
- ✓ Tamil + Kannada UI complete
- ✓ Load test passed (1M DAU, no degradation)
- ✓ Pen-test passed (zero critical/high vulns)
- ✓ Enterprise UAT signed
- ✓ All Phase 1–4 regression passed
- ✓ Zero critical bugs

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">COMMUNICATION CADENCE</h2>

**Daily standup (10 min):**
```
Yesterday: [completed tasks]
Today:     [planned tasks]
Blockers:  [any issues]
```

**Weekly summary (30 min):** Sprint % complete · bugs found/fixed · API developer signups · enterprise pipeline · ARR progress

**Biweekly retrospective:** What went well · What to improve · Velocity · Action items

---

<h2 style="color:#BF360C; border-left:5px solid #BF360C; padding-left:12px;">READY TO BUILD — PHASE 4, SPRINT 1, WEEK 31</h2>

Context: Phase 3 is live. 300K MAU. ₹1.4Cr ARR. NPS ≥ 50. Premium+ converting at 5%.

Provide immediately:

1. **BA** — User stories for web auth + activity CRUD + mobile↔web sync + responsive design
2. **PM** — Sprint 1 board · Vercel setup checklist · risk register update
3. **Dev** — Next.js project setup · Supabase Auth integration (web) · Activity list + CRUD · Check-off (web) · Supabase Realtime sync · Dark mode · Vercel deployment
4. **QA** — Test plan + 20 test cases for web app foundation
5. **DevOps** — Vercel project + GitHub integration · environment variables · custom domain + SSL · PostHog + Sentry on web

**Format: production-ready TypeScript code, not pseudocode. No TODOs. All types explicit.**

---
