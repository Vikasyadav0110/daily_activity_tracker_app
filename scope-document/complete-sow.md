# Daily Activity Tracker — Complete Scope of Work (All Phases)

> **Single source of truth for the entire project.** Compiled from all four phase documents on 2026-06-08.
> For granular details, refer to individual phase files:
> - [phase-1-mvp.md](phase-1-mvp.md) — Weeks 1–8
> - [phase-2-growth.md](phase-2-growth.md) — Weeks 9–18
> - [phase-3-intelligence.md](phase-3-intelligence.md) — Weeks 19–30
> - [phase-4-ecosystem.md](phase-4-ecosystem.md) — Weeks 31–48

---

## Project Overview

| | |
|---|---|
| **Project Name** | Daily Activity Tracker App (India-Market Edition) |
| **Stakeholder** | Vikas (Founder) — Project Management Lead, freelance developer |
| **Total Duration** | 48 weeks (Phases 1–4) |
| **Tech Stack** | React Native (Expo) + SQLite + Supabase + Node.js + Next.js (Phase 4) |
| **Primary Market** | India (App Store + Google Play, India-first) |
| **Success Metric (Phase 1)** | 50,000 downloads in 30 days; 45% D7 retention; 4.3+ star rating |
| **Success Metric (Phase 4)** | 600K+ MAU; ₹5Cr+ ARR; 500+ enterprise customers; 1,000+ API developers |

---

## Claude's Roles (Full-Stack Product & Engineering Team)

1. **BA** — user stories, journey maps, data models, India compliance (DPDP Act, RBI payment guidelines)
2. **PM** — sprint plans, MVP prioritization, PRDs, dependency/critical-path tracking, risk register, weekly summaries
3. **Dev** — production RN (Expo) code, offline SQLite + sync logic, Node.js backend (Supabase), localization, Razorpay, architecture docs
4. **QA** — test plans, manual + automated test cases, CI/CD test setup, bug logging with severity, regression suites, performance testing
5. **DevOps** — CI/CD (GitHub Actions + EAS Build), Expo build envs, secrets/env vars, rollout/beta strategy, store submission checklists, analytics + crash reporting (PostHog, Sentry), prod monitoring

---

## Personas (all product decisions reference these)

| Persona | Profile | Goal | Pain | Solution | Adoption |
|---|---|---|---|---|---|
| **Raj** | 24, UPSC aspirant, Lucknow (Tier 2) | Clear UPSC in 2 yrs | No integrated study tracker | Exam prep mode: subject tracking, mock logging, study streak | Physics Wallah YouTube, college groups |
| **Priya** | 28, IT worker, Delhi | Consistent exercise habit | Forgets to log; wants streak motivation | One-tap logging, streak viz, WhatsApp sharing | Instagram Reels (fitness creators) |
| **Amit** | 35, business owner, Mumbai | Track pooja, fasting, yoga | No app respects Hindu spiritual practices | Vrat tracker, pooja counter, spiritual badges | Word-of-mouth, spiritual communities |
| **Sarah** | 32, HR manager, TCS Bangalore | Track team wellness | No visibility into employee wellness | Corporate workspace, team leaderboard, manager dashboard | LinkedIn, workplace partnerships |

### Raj's Journey Map (Week 1 — Phase 1)
- **Day 1:** Physics Wallah video → downloads → selects Hindi → "Exam Prep Mode" + "UPSC" → 4h daily study target → creates subjects.
- **Days 2–7:** logs sessions ("Constitutional Law – 2h – medium") → daily streak → 8 AM Hindi reminder → "Day 1 Complete" badge.
- **Week 2:** insight ("study most 6–9 AM") → heatmap (10/14 days) → shares streak card on WhatsApp → 3 friends install → 1-week badge unlocked.

---

## Phase Roadmap

| Phase | Weeks | Theme | Prerequisite | Target ARR |
|---|---|---|---|---|
| **Phase 1 — MVP** | 1–8 | Core tracker launch | — | ₹0 (free) |
| **Phase 2 — Growth** | 9–18 | Cloud sync, social, monetization | 50K+ downloads | ₹50L |
| **Phase 3 — Intelligence** | 19–30 | AI coach, wellness, spiritual | 150K MAU, ₹50L ARR | ₹1.4Cr |
| **Phase 4 — Ecosystem** | 31–48 | Web, B2B, API, partnerships | 300K MAU, ₹1.4Cr ARR | ₹5Cr+ |

---

# PHASE 1 — MVP (Weeks 1–8)

**Sprint Goal:** Working app with language selection, onboarding, activity creation + logging, one-tap check-off, and SQLite persistence. 100% offline.

## Feature Prioritization (MoSCoW — Phase 1)

**MUST HAVE:**
Language selection (Hi/En/Ta/Te/Bn) · onboarding quiz (goal setting) · one-tap check-off (**< 100ms — critical**) · daily schedule view · streak counter (48h forgiveness) · calendar heatmap · push notifications · offline-first SQLite · dark mode · basic badges · exam prep mode (UPSC/JEE/NEET/SSC/Banking) · study streak · syllabus progress tracker · mock test logger · no login required.

**SHOULD HAVE:** voice input (Hindi) · WhatsApp streak cards · home screen widget · quantity tracking · activity CSV export · APK < 15 MB.

**COULD HAVE (Phase 2+):** cloud sync · friends leaderboard · AI insights · vrat/pooja · corporate wellness.

**WON'T HAVE:** video coaching · program marketplace · wearables · medical tracking.

## Key Constraints (Phase 1)
1. Check-off < 100ms · 2. 100% offline · 3. Hi+En+Ta+Te+Bn minimum · 4. APK < 15 MB · 5. Memory < 100 MB · 6. No background battery drain · 7. No login (local-only) · 8. DPDP Act readiness.

## Database Schema (SQLite — Phase 1)

```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY, user_id TEXT,
  name TEXT NOT NULL, category TEXT, icon TEXT,
  frequency TEXT, target_duration INTEGER,
  created_at DATETIME, updated_at DATETIME, is_archived BOOLEAN DEFAULT 0
);
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY, activity_id INTEGER NOT NULL,
  log_date TEXT NOT NULL, duration_minutes INTEGER, quantity REAL,
  status TEXT, notes TEXT, created_at DATETIME, updated_at DATETIME,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY, activity_id INTEGER NOT NULL UNIQUE,
  current_streak_days INTEGER, longest_streak_days INTEGER,
  streak_start_date TEXT, last_logged_date TEXT, forgiveness_used BOOLEAN DEFAULT 0,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
CREATE TABLE exam_prep (
  id INTEGER PRIMARY KEY, activity_id INTEGER NOT NULL UNIQUE,
  exam_type TEXT, subjects TEXT, exam_date TEXT, syllabus_coverage_pct INTEGER,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
CREATE TABLE exam_logs (
  id INTEGER PRIMARY KEY, exam_id INTEGER NOT NULL,
  subject TEXT, study_hours REAL, difficulty TEXT, log_date TEXT, created_at DATETIME,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);
CREATE TABLE mock_tests (
  id INTEGER PRIMARY KEY, exam_id INTEGER NOT NULL,
  subject TEXT, score INTEGER, total_marks INTEGER, test_date TEXT, created_at DATETIME,
  FOREIGN KEY (exam_id) REFERENCES exam_prep(id)
);
CREATE TABLE badges (
  id INTEGER PRIMARY KEY, activity_id INTEGER,
  badge_key TEXT UNIQUE, badge_name TEXT, badge_icon TEXT,
  unlocked_at DATETIME, is_earned BOOLEAN DEFAULT 0,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY, user_id TEXT,
  language TEXT DEFAULT 'en', theme TEXT DEFAULT 'light',
  timezone TEXT DEFAULT 'Asia/Kolkata', notification_enabled BOOLEAN DEFAULT 1,
  reminder_times TEXT, created_at DATETIME, updated_at DATETIME
);
```

## Sprint Breakdown (Phase 1)

| Sprint | Weeks | Focus |
|---|---|---|
| Sprint 1 | 1–2 | Onboarding + Activity Logging Foundation |
| Sprint 2 | 3–4 | Streaks + Calendar + Notifications |
| Sprint 3 | 5–6 | Exam Prep Mode + Gamification |
| Sprint 4 | 7–8 | Final Polish + App Store Submission |

**Sprint 1 AC:** language screen on launch · 5 languages correct · quiz completable/skippable · custom activities with icons · check-off no lag · persists across restart · no crashes.
**Sprint 2 AC:** streak correct · 48h forgiveness · heatmap < 500ms · notifications on time + localized · no duplicates · accurate summary card.
**Sprint 3 AC:** all 5 exams · study/mock logging · accurate subject breakdown · badge animations · challenges reset weekly · APK < 15 MB · memory < 100 MB · analytics firing · Sentry live · signed build.
**Sprint 4 AC:** store submissions ready · 2-week beta soak · ToS/privacy final · all languages approved · accessibility baseline · monitoring configured.

**Go/No-Go (end Week 8):** all AC met · QA exit met · no show-stoppers · stakeholder approval.

## Phase 1 Success Criteria
App on App Store + Google Play (India) · 50K downloads in 30 days · 45%+ D7 retention · 4.3+ rating · < 5% crash · < 2s startup · 100+ campus ambassadors · first corporate wellness pilot.

## Phase 1 Risks
1. Check-off lag (Med/High) → perf profiling, < 100ms target.
2. Localization delays (Med/Med) → Hindi expert W1, pro translation.
3. App Store rejection (Low/High) → review guidelines W1, beta W6.
4. Campus ambassador slow (Med/Med) → PW partnerships, incentives.
5. Exam prep complexity (Low/Med) → plan early, simplify if needed.

## Phase 1 Budget (~₹7,50,000 excl. salary)
Infra ₹500/mo · Localization ₹1,40,000 · Campus ambassadors ₹5,50,000 · Misc ₹52,000.

---

# PHASE 2 — GROWTH (Weeks 9–18)

**Target:** 10,000 MAU → 150K MAU; ₹50L ARR; 30% Day-60 retention; 5+ B2B pilots.

## Key Additions
Cloud sync (optional) · deep analytics · WhatsApp-first social · friends + leaderboards · India-tuned monetization · corporate wellness B2B · platform enhancements (widget, Health/Fit sync).

## Monetization Tiers (introduced Phase 2)

| Tier | Price | Key Limits |
|---|---|---|
| **Free** | ₹0 | ≤7 activities, 30-day analytics, ≤3 friends, 1 challenge, ads |
| **Pro** | ₹49/mo or ₹399/yr | unlimited everything, cloud sync, ad-free, CSV export |
| **Lifetime Pro** | ₹999 one-time | all Pro features forever, limit 1/user |
| **Family** (Phase 2.5) | ₹299/mo, 5 members | all Pro per member, shared challenges |
| **College** | 50% off Pro | .edu email verification |
| **B2B** | ₹199/seat/mo (min 10) | team workspace ≤500, manager dashboard, challenges |

## New DB Tables (Phase 2)
`users` · `user_profiles` · `friends` · `leaderboards` · `challenges` · `shares` · `subscriptions` · `team_workspaces` · `team_members` · `team_challenges` · `analytics_daily`

## Sprint Breakdown (Phase 2)

| Sprint | Weeks | Focus |
|---|---|---|
| Sprint 1 | 9–10 | Auth + Cloud Sync Foundation (Supabase, bi-directional, Phase 1→2 migration) |
| Sprint 2 | 11–12 | Analytics Deep-Dive (heatmap, goal vs actual, subject progress, CSV/PDF export) |
| Sprint 3 | 13–14 | WhatsApp-First Social + Friends (streak cards, leaderboard, challenges) |
| Sprint 4 | 15–16 | Monetization + Gamification Full (Razorpay, XP/levels, feature gating, seasonal quests) |
| Sprint 5 | 17–18 | Corporate B2B + Platform Features + Launch Prep (team workspace, widget, Health/Fit, regression) |

## Phase 2 → Phase 3 Handoff
150K MAU · 30K DAU · ₹50L ARR · 30% Day-60 retention · 5+ corporate accounts · stable cloud sync · 40% WhatsApp share rate.

---

# PHASE 3 — INTELLIGENCE (Weeks 19–30)

**Target:** 300K MAU; ₹1.4Cr ARR; 35% Day-90 retention; NPS ≥ 50; 100+ B2B accounts.

## Key Additions
AI Weekly Review (Claude API) · AI Coach Nudges · Mood & Wellbeing Tracking · Vrat/Fasting Tracker · Pooja/Mantra Counter · Ayurveda Tips · Smart Scheduling · Premium+ tier (₹149/mo).

## Subscription Tiers (Phase 3 full picture)

| Tier | Price | Key Features |
|---|---|---|
| **Free** | ₹0/mo | Phase 1 core with limits |
| **Pro** | ₹49/mo or ₹399/yr | unlimited + cloud sync, ad-free |
| **Lifetime Pro** | ₹999 one-time | Pro forever |
| **Premium+** | ₹149/mo or ₹1,490/yr | all Pro + AI weekly review, AI coach, mood tracking, full vrat/pooja, Ayurveda, smart scheduling, priority support, early access |
| **Family** | ₹299/mo, 5 members | Pro per member |

## New DB Tables (Phase 3)
`mood_logs` · `fasts` · `mantra_logs` · `ai_insights` · `ai_coach_messages` · `scheduled_plans` · `wellness_tips` · `dosha_profiles`

## Sprint Breakdown (Phase 3)

| Sprint | Weeks | Focus |
|---|---|---|
| Sprint 1 | 19–20 | AI Weekly Review + Claude API Integration |
| Sprint 2 | 21–22 | Mood & Wellbeing + Mood-Activity Correlation |
| Sprint 3 | 23–24 | Vrat/Fasting + Pooja/Mantra Counter (Spiritual) |
| Sprint 4 | 25–26 | Ayurveda Tips + Smart Scheduling + AI Coach Nudges |
| Sprint 5 | 27–28 | Premium+ Tier Launch + Subscription Management |
| Sprint 6 | 29–30 | Full Regression + B2B Expansion + Launch Prep |

## Phase 3 Risks
1. Claude API cost (Med/High) → cache, batch, fallback, weekly monitoring.
2. Vrat/pooja culturally inaccurate (Low/High) → cultural consultant, spiritual advisor beta.
3. Mood tracking privacy (Med/Med) → local storage option, full transparency, no sharing without consent.
4. AI coach generic (Med/Med) → A/B test, heavy personalization, weekly iteration.
5. Smart scheduling underused (Low/Low) → simplify UX, templates.

## Phase 3 Budget (~₹4,47,500 excl. salary)
Claude API ₹22,500 · Infra scaling ₹45,000 · Localization ₹90,000 · Marketing ₹1,30,000 · Design/content ₹70,000 · Misc ₹40,000.

## Phase 3 → Phase 4 Handoff
300K MAU · 60K DAU · ₹1.4Cr ARR · 35% Day-90 retention · NPS ≥ 50 · 100+ corporate accounts · Premium+ 5% conversion · AI 70% Premium+ engagement.

---

# PHASE 4 — ECOSYSTEM (Weeks 31–48)

**Target:** 600K+ MAU; ₹5Cr+ ARR; 500+ enterprise customers; 1,000+ API developers.

## Key Additions
Full web app (Next.js) · enterprise B2B (SSO, SAML, audit logs, bulk management) · third-party integrations (Zapier, Slack, Google Calendar, Notion) · public REST API (v1) · strategic partnerships (Unacademy, Cult.fit, HDFC Ergo) · marketplace (programs, courses) · South India geographic expansion (Tamil + Kannada).

## New DB Tables (Phase 4)
`api_keys` · `api_logs` · `integrations` · `marketplace_programs` · `program_enrollments` · `enterprise_contracts`

## Public REST API v1

```
[AUTH]       POST /api/v1/auth/signup|signin|refresh
[ACTIVITIES] GET/POST /api/v1/activities · PATCH/DELETE /api/v1/activities/:id
[LOGS]       GET/POST /api/v1/activities/:id/logs · PATCH/DELETE /api/v1/logs/:id
[ANALYTICS]  GET /api/v1/analytics/summary|trends|correlation
[SOCIAL]     GET /api/v1/friends · POST /api/v1/friends/:id/challenge · GET /api/v1/leaderboard
[INSIGHTS]   GET /api/v1/insights/latest|history
```

API pricing: Free 1,000 req/mo · Pro $9/mo (10,000 req/mo) · Enterprise custom.

## Sprint Breakdown (Phase 4)

| Sprint | Weeks | Focus |
|---|---|---|
| Sprint 1 | 31–32 | Web App Foundation (Next.js, auth, activity CRUD, Vercel) |
| Sprint 2 | 33–34 | Web Analytics + Dashboard |
| Sprint 3 | 35–36 | REST API v1 + Documentation |
| Sprint 4 | 37–38 | Third-Party Integrations (Zapier, Calendar, Slack, Notion) |
| Sprint 5 | 39–40 | B2B Enterprise (SSO, audit logs, bulk CSV, deprovisioning) |
| Sprint 6 | 41–42 | B2B Advanced Analytics + Manager Dashboard |
| Sprint 7 | 43–44 | Marketplace + Developer Portal |
| Sprint 8 | 45–46 | Partnerships + Geographic Expansion (South India) |
| Sprint 9 | 47–48 | Final Regression + Scale Testing (1M DAU) + Launch Prep |

## Phase 4 Risks
1. Web perf lags mobile (Med/Med) → mobile-first build, perf budgets.
2. API misuse/scraping (Med/Med) → strict rate limiting, abuse detection.
3. Enterprise security audit failure (Low/High) → SOC2 W40, pen-test, compliance team.
4. Partnership integration complexity (Med/Med) → phased rollout (Zapier first).
5. Slow API developer adoption (Med/Med) → generous free tier, hackathon, community forum.
6. Slow South India expansion (Med/Low) → partner-led via Unacademy/Cult.fit.

## Phase 4 Budget (~₹25L excl. salary)
Web/API/integrations/enterprise/portal ₹4.3L · Security/compliance (SOC2+pen-test+GDPR) ₹3.5L · Infra scaling ₹1.5L · Marketplace ₹80K · Partnerships/BD ₹14L (incl. sales team) · Marketing/launch ₹3L · South India localization ₹2L · Misc ₹2L.

## Post-Phase 4 / Future Horizons
600K+ MAU · 120K+ DAU · ₹5Cr+ ARR · 500+ enterprise customers · 1,000+ API developers · 50+ partnerships · India market leader.
Phase 5+ candidates: global expansion (US/Europe/SEA) · wearables · health system integrations (EHR) · AI coaching scaling · IPO readiness (₹10Cr+ ARR target).

---

# DevOps / CI-CD (All Phases)

**Branching:** `main` (prod, protected) → `develop` (staging) → `feature/*` (dev).
**Pre-commit:** ESLint + Prettier · Jest unit tests · TypeScript check.
**GitHub Actions:** PR→develop → lint+tests; PR approved → EAS staging build; merge→main → EAS prod build.
**EAS Build:** staging auto-signed on develop; production manual on main (store keys).
**Distribution:** TestFlight (iOS beta) → App Store; Google Play Open → Internal → Production.
**Monitoring:** Sentry (crash) · PostHog (opt-in analytics) · EAS Updates (OTA hotfixes).

**Deployment Checklist (each phase release):**
All tests passing · no high/critical bugs · signing keys verified · privacy policy + ToS reviewed · localization QA passed · APK < 15 MB / memory < 100 MB · store metadata filled · content ratings · crash reporting · analytics wired · 2-week beta soak · PM+Dev final review · go/no-go · prod release.

---

# Communication & Cadence

**Daily Standup (15 min):** Yesterday done · Today's plan · Blockers · Vikas: go/no-go decisions.
**Sprint Retrospective (every 2 weeks):** What went well · What could improve · Action items.
**Weekly Progress Summary to Vikas:** Features completed · bugs found/fixed · performance metrics · risks/blockers · next week's plan.

---

# Cumulative Budget Summary

| Phase | Duration | Budget (excl. salary) |
|---|---|---|
| Phase 1 — MVP | Weeks 1–8 | ~₹7,50,000 |
| Phase 2 — Growth | Weeks 9–18 | ~₹5,32,500 |
| Phase 3 — Intelligence | Weeks 19–30 | ~₹4,47,500 |
| Phase 4 — Ecosystem | Weeks 31–48 | ~₹25,00,000 |
| **Total** | **48 weeks** | **~₹42,30,000** |

---

# Cumulative ARR Targets

| Milestone | MAU | ARR Target |
|---|---|---|
| Phase 1 launch | 50K downloads | — |
| Phase 2 complete | 150K MAU | ₹50L |
| Phase 3 complete | 300K MAU | ₹1.4Cr |
| Phase 4 complete | 600K+ MAU | ₹5Cr+ |
