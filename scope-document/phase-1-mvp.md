# Daily Activity Tracker — Phase 1 MVP Scope of Work

> **Source of truth for Phase 1 (Weeks 1–8).** Pasted from Vikas's end-to-end project prompt on 2026-06-08.
> Phases 2–4 will be added to this folder as separate files as they are shared.

---

## Project Overview

- **Project Name:** Daily Activity Tracker App (India-Market Edition)
- **Client/Stakeholder:** Vikas (Founder) — Project Management Lead, freelance developer
- **Project Duration:** 12 weeks (Phase 1 MVP framing); Phase 1 build window = 8 weeks
- **Technology Stack:** React Native (Expo) + SQLite (offline-first) + Supabase (backend, Phase 2) + Node.js
- **Primary Market:** India
- **Target Launch:** App Store + Google Play (India-first)
- **Success Metric:** 50,000 downloads in 30 days; 45% D7 retention; 4.3+ star rating

## Scope of Work (SOW)

- **PHASE 1 MVP (Weeks 1–8):** Core tracker launch ← *current focus*
- **PHASE 2 Growth (Weeks 9–18):** Cloud sync, social, monetization
- **PHASE 3 Intelligence (Weeks 19–30):** AI coach, wellness modules
- **PHASE 4 Ecosystem (Weeks 31–48):** Web, B2B, partnerships

Vikas focuses on Phase 1 MVP. Phases 2–4 are outlined for planning but implementation deferred.

---

## Claude's Roles (full-stack product & engineering team)

1. **BA** — user stories, journey maps, data models, India compliance (DPDP Act, RBI payment guidelines)
2. **PM** — sprint plans, MVP prioritization, PRDs, dependency/critical-path tracking, risk register, weekly summaries
3. **Dev** — production RN (Expo) code, offline SQLite + sync logic, Node.js backend (Supabase alt), localization, Razorpay (Phase 2), architecture docs
4. **QA** — test plans, manual + automated test cases, CI/CD test setup, bug logging with severity, regression suites, performance testing (APK size, memory, battery)
5. **DevOps** — CI/CD (GitHub Actions + EAS Build), Expo build envs, secrets/env vars, rollout/beta strategy, store submission checklists, analytics + crash reporting (PostHog, Sentry), prod monitoring

---

## Personas (use for ALL product decisions)

| Persona | Profile | Goal | Pain | Solution | Adoption |
|---|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 yrs | No integrated study tracker; jumps apps | Exam prep mode: subject tracking, mock logging, study streak | Physics Wallah YouTube, college groups |
| **Priya** | 28, IT, Delhi | Consistent exercise habit | Forgets to log; wants streak motivation | One-tap logging, streak viz, WhatsApp sharing | Instagram Reels (fitness creators) |
| **Amit** | 35, business owner, Mumbai | Track daily pooja, fasting, yoga | No app respects Hindu spiritual practices | Vrat tracker, pooja counter, spiritual badges | Word-of-mouth, spiritual communities |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Corporate workspace, team leaderboard, manager dashboard | LinkedIn, workplace partnerships |

### Raj's Journey Map (Week 1)
- **Day 1:** Discovers via Physics Wallah video → downloads → selects Hindi → "Exam Prep Mode" + "UPSC" → sets 4h daily study target → creates subjects (Constitutional Law, History, Geography…).
- **Day 2–7:** Logs sessions ("Constitutional Law – 2h – difficulty: medium") → sees daily streak → 8 AM Hindi reminder ("Aaj ka padhai program start karo") → earns "Day 1 Complete" badge.
- **Week 2 retention:** Insight ("You study most 6–9 AM") → calendar heatmap (10/14 days) → shares streak card on WhatsApp → 3 friends install + join study group → completes 1-week challenge, unlocks badge.

---

## Feature Prioritization (MoSCoW)

### MUST HAVE (Phase 1 MVP)
1. Language selection (Hindi + English + Tamil; Telugu + Bengali also supported)
2. Onboarding quiz (goal setting)
3. One-tap activity check-off (**zero lag — < 100ms, critical**)
4. Daily schedule view
5. Streak counter (48h forgiveness)
6. Calendar heatmap
7. Push notifications (reminders + gentle nudges)
8. Offline-first SQLite
9. Dark mode
10. Basic gamification (badges)
11. Exam prep mode (UPSC, JEE, NEET, SSC, Banking)
12. Study streak tracker
13. Syllabus progress tracker (exam mode)
14. Mock test logger (exam mode)
- No login required (local-only mode for privacy)

### SHOULD HAVE (Phase 1 stretch)
Voice input in Hindi · WhatsApp-shareable streak cards · Home screen widget · Quantity tracking (e.g. 8 glasses water) · Multiple activity categories · Activity history export (CSV) · APK < 15 MB

### COULD HAVE (Phase 2+)
Cloud sync · Friends leaderboard · AI insights · Vrat/pooja tracking · Corporate wellness

### WON'T HAVE (Phase 1)
Video coaching · Program marketplace · Wearable support · Medical/clinical tracking

---

## Key Constraints & Requirements

1. **Performance:** one-tap check-off < 100ms (no perceptible lag)
2. **Offline-first:** 100% functional without internet
3. **Localization:** Hindi + English + Tamil + Telugu minimum (Bengali too)
4. **APK size:** < 15 MB on Android (low-storage devices)
5. **Memory:** < 100 MB typical (Tier 2/3 devices)
6. **Battery:** no background drain; sync only on WiFi
7. **Data model:** full offline SQLite, no cloud dependency in Phase 1
8. **No login in Phase 1:** local-only by default (cloud sync = Phase 2)
9. **India-specific:** Hindu calendar, Vrat dates, Pooja times (Phase 2)
10. **Compliance:** DPDP Act readiness, no tracking without consent

---

## Database Schema (SQLite) — authoritative Phase 1 DDL

```sql
-- activities
CREATE TABLE activities (
  id INTEGER PRIMARY KEY,
  user_id TEXT,                 -- nullable (Phase 2 cloud sync)
  name TEXT NOT NULL,           -- "Gym", "Study"
  category TEXT,                -- "Fitness", "Study", "Spiritual"
  icon TEXT,                    -- emoji or icon name
  frequency TEXT,               -- "daily", "weekly", "{mon,wed,fri}", custom
  target_duration INTEGER,      -- minutes, nullable
  created_at DATETIME,
  updated_at DATETIME,
  is_archived BOOLEAN DEFAULT 0
);

-- activity_logs
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,       -- YYYY-MM-DD
  duration_minutes INTEGER,     -- nullable
  quantity REAL,                -- nullable (e.g. 8 glasses)
  status TEXT,                  -- "completed", "skipped", "missed"
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- streaks
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER NOT NULL UNIQUE,
  current_streak_days INTEGER,
  longest_streak_days INTEGER,
  streak_start_date TEXT,       -- YYYY-MM-DD
  last_logged_date TEXT,        -- YYYY-MM-DD
  forgiveness_used BOOLEAN DEFAULT 0,  -- 48h grace used this cycle?
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- exam_prep
CREATE TABLE exam_prep (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER NOT NULL UNIQUE,
  exam_type TEXT,               -- "UPSC","JEE","NEET","SSC","Banking"
  subjects TEXT,                -- JSON: [{ name, completion }]
  exam_date TEXT,               -- YYYY-MM-DD
  syllabus_coverage_pct INTEGER,-- 0–100
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- exam_logs
CREATE TABLE exam_logs (
  id INTEGER PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  subject TEXT,
  study_hours REAL,             -- e.g. 2.5
  difficulty TEXT,              -- "easy","medium","hard"
  log_date TEXT,                -- YYYY-MM-DD
  created_at DATETIME,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);

-- mock_tests
CREATE TABLE mock_tests (
  id INTEGER PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  subject TEXT,                 -- nullable for general exams
  score INTEGER,
  total_marks INTEGER,
  test_date TEXT,               -- YYYY-MM-DD
  created_at DATETIME,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);

-- badges
CREATE TABLE badges (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER,          -- nullable for global badges
  badge_key TEXT UNIQUE,        -- "streak_7","streak_30","studied_100_hours"
  badge_name TEXT,
  badge_icon TEXT,
  unlocked_at DATETIME,         -- nullable if not earned
  is_earned BOOLEAN DEFAULT 0,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- app_settings
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY,
  user_id TEXT,                 -- nullable (local-only Phase 1)
  language TEXT DEFAULT 'en',   -- "hi","en","ta","te","bn"
  theme TEXT DEFAULT 'light',   -- "light","dark"
  timezone TEXT DEFAULT 'Asia/Kolkata',
  notification_enabled BOOLEAN DEFAULT 1,
  reminder_times TEXT,          -- JSON: [{ activity_id, time: "08:00" }]
  created_at DATETIME,
  updated_at DATETIME
);
```

> **Note:** The current repo migration `src/services/db/migrations/001_initial.sql` should be reconciled against this schema. Notably this SOW adds a separate `mock_tests` table (vs. the earlier single exam-log design).

## API Specification (Phase 2 Supabase backend — design now)

```
POST /api/auth/signup            { email, password } -> { user_id, token }
POST /api/activities             { name, category, icon, frequency, target_duration } -> { activity_id, ... }
GET  /api/activities             -> [{ id, name, category, ... }]
POST /api/activity-logs          { activity_id, duration_minutes, quantity, status, notes } -> { log_id, ... }
GET  /api/activity-logs/:date    -> [{ activity_id, status, duration, ... }]
GET  /api/streaks/:activity_id   -> { current_streak, longest_streak, last_logged_date, ... }
GET  /api/badges/:activity_id    -> [{ badge_name, unlocked_date, ... }]
GET  /api/exam-prep/:activity_id -> { exam_type, subjects, exam_date, syllabus_coverage_pct, ... }
```

---

## Tech Architecture

**Frontend (RN + Expo):** React Navigation (bottom tabs: Home, Progress, Settings) · Zustand + React Query · Expo SQLite · i18next · React Native Paper + custom components · Axios (Phase 2 sync).

**Backend (Phase 2, design now):** Node.js + Express · PostgreSQL (Supabase) · Supabase Auth (optional) · Supabase Storage · Supabase Realtime (Phase 2 sync).

---

## Sprint Breakdown (8 weeks)

> **Note on numbering:** This SOW uses Sprint 1 = Weeks 1–2, but the prompt body also references "Week 3–4 Sprint 1." Treat the *content* below as canonical, mapped onto four 2-week sprints across 8 weeks. The repo's existing `docs/sprint-board.md` already tracks Sprint 1 execution.

### Sprint 1 (Weeks 1–2): Onboarding + Activity Logging Foundation
Language selection (i18next) · onboarding quiz (goal + exam-mode detection) · activity creation modal (name, icon, frequency, category) · SQLite schema (activities, activity_logs) · one-tap check-off (< 100ms) · activity CRUD SQLite utils · GitHub Actions lint+test.

**AC:** launches w/ language screen · 5 languages render correctly · quiz completable or skippable · custom activities w/ icons · check-off no perceptible lag · persists across restart · no crashes on iOS 13+/Android 8+.
**QA exit:** 100% test cases pass · no critical/high bugs · localization (no overflow) · acceptable battery/memory.

### Sprint 2 (Weeks 3–4): Streaks + Calendar + Notifications
Streak algorithm (48h forgiveness) · calendar heatmap · Expo push notifications · reminder scheduling · morning/evening check-ins · daily summary card.
**AC:** streak displays correctly · 48h forgiveness works · heatmap < 500ms · notifications deliver on time + correct language · no duplicate notifications · accurate summary card.
**QA exit:** notification tests pass · streak edge cases (timezone, leap days) verified · calendar performance OK · no notification crashes.

### Sprint 3 (Weeks 5–6): Exam Prep Mode + Gamification
Exam prep mode (5 exams) · study logger (subject/hours/difficulty) · mock test logger (score/date/trend) · subject-wise analytics (weak spots) · badge system (logic/UI/animations) · daily/weekly challenges · APK < 15 MB · PostHog analytics events · app signing · Sentry · production EAS build.
**AC:** all 5 exams · sessions logged w/ subject+duration+difficulty · mock trends visible · accurate subject breakdown · badges unlock w/ animations · challenges reset weekly · APK < 15 MB · memory < 100 MB · acceptable battery · analytics firing · crash reporting live · signed prod build.
**QA exit:** 100% pass · zero critical/high · perf targets met · regression passed · prod-ready.

### Sprint 4 (Weeks 7–8): Final Polish, Testing, Store Submission
Marketing collateral (screenshots, description, keywords) · launch comms plan · code review/cleanup · OTA updates (EAS Updates) · basic security review (no hardcoded secrets) · full regression · localization QA · accessibility (VoiceOver/TalkBack) · beta (TestFlight + Open Testing, 2-week soak) · test summary report · App Store + Google Play submission · release notes · post-launch monitoring · user docs (FAQ, tutorials).
**Go/No-Go (end Week 8):** all AC met · QA exit met · no show-stoppers · team agreement · stakeholder approval. No-go → defer 1–2 weeks.

---

## QA Strategy

**In scope:** functional (must-haves) · localization (hi/en/ta/te/bn) · device compat (iOS 13+, Android 8+) · performance (APK/memory/battery) · offline · data integrity (SQLite, streaks, badges) · accessibility basics.
**Out of scope Phase 1:** security testing (→ Phase 2 cloud sync) · load testing (single-user app).
**Environments:** local (Expo Go on device) · staging (EAS) · beta (TestFlight + Play Open Testing) · production (stores).

**Sample test case — Streak 48h Forgiveness:**
> Given a 7-day streak, when user misses 1 day and logs on day 3 (within 48h), then streak is maintained (still 7, not reset), indicator shows "48h grace used: 1/2", and next miss resets streak to 0.

---

## DevOps / CI-CD

- **Branching:** `main` (prod, protected), `develop` (staging), `feature/*` (dev).
- **Pre-commit:** ESLint + Prettier, Jest unit tests, TypeScript check.
- **GitHub Actions:** PR→develop runs lint+tests; PR approved triggers EAS staging build; merge→main triggers EAS prod build.
- **EAS Build:** staging auto-signed on develop commits; production manual on main (store keys).
- **Distribution:** TestFlight (iOS beta) → App Store; Google Play Open → Internal → Production.
- **Monitoring:** Sentry (crash), PostHog (opt-in analytics), EAS Updates (OTA hotfixes).

**Deployment checklist:** tests passing · no high/critical bugs · signing keys verified · privacy policy + ToS reviewed · localization QA passed · APK < 15 MB / memory < 100 MB · store metadata filled · content ratings · crash reporting on · analytics wired · beta 2-week soak · PM+Dev final review · go/no-go · prod release.

---

## Success Criteria (Phase 1 launch)
App live on App Store + Google Play (India) · 50k downloads in 30 days · 45%+ D7 retention · 4.3+ rating · < 5% crash rate · < 2s startup · 100+ campus ambassadors · first corporate wellness pilot.

## Risk Register
1. **Check-off lag** (Med/High) → weekly perf profiling, < 100ms target.
2. **Localization delays** (Med/Med) → Hindi expert by Week 1, pro translation.
3. **App Store rejection** (Low/High) → review guidelines Week 1, beta at Week 6.
4. **Campus ambassador recruitment slow** (Med/Med) → start Week 1, PW partnerships, incentives.
5. **Exam prep complexity underestimated** (Low/Med) → plan early, simplify MVP if needed.

## Budget (Phase 1, ~₹7,50,000 excl. salary)
Infra ~₹500/mo (Supabase free, EAS $30/mo, Sentry/PostHog/GitHub free) · Localization ~₹1,40,000 (Hindi ₹50k + Tamil/Telugu/Bengali ~₹30k each) · Campus ambassadors ~₹5,50,000 (500×₹500×2mo + ₹50k materials) · Misc ~₹52,000 (Apple ₹1,300, Play ₹600, design ₹50k).
