# Daily Activity Tracker — Phase 2 Growth Scope of Work

> **Source of truth for Phase 2 (Weeks 9–18, 10 weeks / ~2.5 months).** Pasted from Vikas's Phase 2 execution plan on 2026-06-08. **Complete.**
> **Prerequisite:** Phase 1 MVP launched with 50K+ downloads.
> **Tech Stack:** Phase 1 stack + Supabase backend (PostgreSQL) + Node.js API.

---

## Phase 2 Overview

Phase 1 shipped core tracking. Phase 2 adds:
1. Cloud sync (optional, not required)
2. Deep analytics (goal vs actual, time-of-day heatmap, trends)
3. Social features (friends, leaderboards, challenges)
4. WhatsApp-first sharing
5. India-tuned monetization (₹49/mo Pro, ₹999 lifetime, family plan)
6. Corporate wellness B2B module
7. Platform enhancements (widgets, health app integration)

### Success Metrics
- 10,000 MAU (from 50K Phase 1 downloads)
- 8% Pro conversion (500 paying users)
- 30% Day-60 retention
- 5+ corporate wellness pilot accounts
- ≥ 40% WhatsApp sharing rate
- ₹50L ARR total (₹40L consumer + ₹10L B2B)

---

## Feature Breakdown

### FS1: Cloud Sync & Account (Optional Sign-up)
- **Must:** Email + Google + Apple Sign-In (local mode free forever) · real-time cross-device sync (iOS, Android, web dashboard) · account recovery · UPI Autopay (Razorpay, GPay, PhonePe, Paytm).
- **Nice:** privacy toggle (local ↔ cloud anytime) · E2E encryption for sensitive data.

### FS2: Deep Analytics
- **Must:** goal vs actual chart · time-of-day heatmap · category breakdown (pie) · trend analysis (WoW per activity) · best/worst day of week · subject-wise progress (exam mode) · weekly completion %.
- **Nice:** monthly styled PDF report · CSV/JSON export · predictive insights ("at current pace, syllabus done by [date]").

### FS3: WhatsApp-First Social
- **Must:** shareable streak cards (9:16 for WhatsApp status) · shareable weekly summary graphic · invite-friends link (WhatsApp) · friends leaderboard (streaks + XP, not activity details) · weekly friend challenges (beat my weekly XP).
- **Nice:** group chat invite · friend accountability partner (notified if they miss a day).

### FS4: Gamification Full
- **Must:** XP/points (10 XP/activity, +50 streak-day bonus) · level system (1–50 by cumulative XP) · weekly auto-challenges (suggested from weak spots).
- **Nice:** seasonal cricket-themed quests · festival themes (Diwali/Holi/Eid auto-apply) · leaderboard tiers (bronze/silver/gold).

### FS5: Platform Enhancements
- **Must:** home screen widget (today's completion ring + next activity) · Apple Health sync (steps, workout min) · Google Fit sync.
- **Nice:** lock screen widget (iOS 16+) · Siri/Google Assistant voice commands.

### FS6: India-Tuned Monetization

| Tier | Price | Activities | Analytics | Friends | Challenges | Cloud sync | Other |
|---|---|---|---|---|---|---|---|
| **Free** | ₹0 | ≤7 | 30 days | ≤3 | 1 active | ✗ | minimal ads |
| **Pro** | ₹49/mo or ₹399/yr | ∞ | ∞ | ∞ | ∞ | ✓ | all themes, ad-free, CSV export, priority support |
| **Lifetime Pro** | ₹999 one-time | Everything Pro forever | | | | | IAP, limit 1/user |
| **Family** (Phase 2.5) | ₹299/mo, ≤5 | All Pro per member | | | | | shared challenges + family analytics |
| **College discount** | 50% off Pro (₹24.50/mo) | with .edu email verification | | | | | |

### FS7: Corporate Wellness (B2B)
- **Must:** admin dashboard · team workspace (≤500 members) · team leaderboard (weekly/monthly XP) · manager dashboard (anonymized HR metrics) · custom team challenges · bulk CSV email invite · monthly wellness PDF · Google Workspace SSO.
- **Nice:** Slack bot · Google Calendar sync · aggregated anonymized employee wellness insights.
- **Pricing:** ₹199/seat/month (min 10 seats). **Targets:** TCS, Infosys, Wipro, HCL, Accenture, Cognizant (5 pilots).

---

## Database Schema Additions (Phase 2)

New tables layered on Phase 1 schema. All `id` are TEXT (UUID), user FKs reference Supabase Auth `users`.

```sql
users (id PK, email UNIQUE, display_name, profile_picture_url?, phone?,
       auth_provider /*email|google|apple*/, is_local_only BOOLEAN DEFAULT 1,
       created_at, updated_at)

user_profiles (id PK, user_id UNIQUE FK, language, theme, timezone,
       notification_enabled, bio?, profile_visibility /*private|friends|public*/,
       created_at, updated_at)

friends (id PK, user_id FK, friend_user_id FK, status /*pending|accepted|blocked*/,
       created_at, updated_at, UNIQUE(user_id, friend_user_id))

leaderboards (id PK, user_id FK, leaderboard_type /*weekly|monthly|all_time*/,
       xp_total DEFAULT 0, rank, week_start /*YYYY-MM-DD*/, created_at, updated_at)

challenges (id PK, user_id FK, challenge_type /*weekly_auto|friend|team*/,
       activity_id?, target_count, target_metric /*days|hours|activities*/,
       status /*active|completed|failed*/, xp_reward, start_date, end_date,
       created_at, updated_at)

shares (id PK, user_id FK, content_type /*streak_card|weekly_summary|achievement*/,
       content_data /*JSON*/, share_platform /*whatsapp|instagram|twitter*/,
       share_count DEFAULT 0, created_at)

subscriptions (id PK, user_id UNIQUE FK,
       subscription_type /*pro_monthly|pro_yearly|lifetime|family|college*/,
       razorpay_subscription_id, status /*active|cancelled|expired*/,
       amount_paid REAL /*INR*/, billing_cycle /*monthly|yearly|one_time*/,
       start_date, renewal_date, cancel_date?, created_at, updated_at)

team_workspaces (id PK, team_name, admin_user_id FK, member_count DEFAULT 1,
       max_members DEFAULT 500, status /*active|paused|archived*/,
       company_name?, industry?, created_at, updated_at)

team_members (id PK, team_id FK, user_id FK, role /*admin|member*/,
       joined_at, UNIQUE(team_id, user_id))

team_challenges (id PK, team_id FK, challenge_name, description,
       target_count, target_metric /*steps|days|hours*/,
       start_date, end_date, status /*active|completed|cancelled*/, created_at)

analytics_daily (id PK, user_id FK, date /*YYYY-MM-DD*/, activities_logged,
       activities_completed, activities_skipped, total_duration_minutes,
       xp_earned, mood_rating /*1-5, Phase 3*/, created_at,
       UNIQUE(user_id, date))
```

---

## API Specification (Phase 2)

### Auth
```
POST /api/auth/signup           { email, password } -> { user_id, token, user{id,email} }  (409)
POST /api/auth/signin           { email, password } -> { user_id, token, user{...} }        (401)
POST /api/auth/signin-google    { google_id_token } -> { user_id, token, user{...} }
POST /api/auth/signin-apple     { apple_id_token }  -> { user_id, token, user{...} }
POST /api/auth/logout           Bearer -> { success }
POST /api/auth/refresh-token    { refresh_token } -> { token, refresh_token }
```

### Cloud Sync (Bearer)
```
POST /api/sync/activities       { activities:[...] } -> { synced_count, conflicts:[] }
GET  /api/sync/activities       ?since=ts -> [{...}]
POST /api/sync/activity-logs    { logs:[...] } -> { synced_count }
GET  /api/sync/activity-logs    ?since=ts -> [{...}]
```

### Analytics (Bearer)
```
GET /api/analytics/summary/:date_range  ?start_date&end_date -> { total_activities, completed, completion_rate, xp_earned, best_day, worst_day }
GET /api/analytics/heatmap/:period      ?period=week|month -> { heatmap:[{date,intensity,activities}] }
GET /api/analytics/time-of-day         -> { distribution:[{hour,activity_count,pct}] }
GET /api/analytics/category-breakdown  -> { categories:[{name,hours,pct}] }
GET /api/analytics/subject-progress    -> { exam_type, subjects:[{name,completion,study_hours}] }
```

### Social (Bearer)
```
POST   /api/friends/add                 { friend_username|friend_user_id } -> { friend_id, status:pending }
GET    /api/friends                     -> [{ user_id, display_name, streak_days, xp_total, status }]
POST   /api/friends/:friend_id/accept   -> { friend_id, status:accepted }
DELETE /api/friends/:friend_id          -> { success }
GET    /api/leaderboard/weekly          ?team_id? -> [{ rank, user_id, display_name, xp, streak_days }]
GET    /api/leaderboard/monthly         -> [{ rank, ... }]
```

### Challenges (Bearer)
```
POST /api/challenges/friend-challenge        { friend_user_id, activity_id, target_days } -> { challenge_id, status:active }
GET  /api/challenges/my-active               -> [{ challenge_id, type, target, progress, xp_reward }]
POST /api/challenges/:challenge_id/complete  -> { challenge_id, status:completed, xp_awarded }
```

### Shares (Bearer)
```
POST /api/shares/streak-card     { activity_id } -> { share_card:{image_url,text}, share_link }
POST /api/shares/weekly-summary  -> { image_url, text }
POST /api/shares/track           { share_id, platform } -> { tracked:true }
```

### Subscriptions (Bearer)
```
POST /api/subscriptions/create           { plan, razorpay_payment_id } -> { subscription_id, status:active, renews_at }
GET  /api/subscriptions/my-subscription  -> { subscription_id, plan, status, renews_at, features:[] }
POST /api/subscriptions/cancel           -> { subscription_id, status:cancelled }
```

### Team Workspace (Bearer)
```
POST /api/teams/create                { team_name, company_name, industry } -> { team_id, admin_user_id, member_count:1 }
GET  /api/teams/:team_id              -> { team_id, team_name, member_count, members:[], challenges:[] }
POST /api/teams/:team_id/invite       { emails:[...] } -> { invited_count, pending_invites }  [admin]
POST /api/teams/:team_id/join         { invite_code } -> { team_id, team_name, role:member }
GET  /api/teams/:team_id/leaderboard  -> [{ rank, user_id, display_name, xp, streak_days }]
POST /api/teams/:team_id/challenges   { challenge_name, target_count, target_metric, end_date } -> { challenge_id, status:active }  [admin]
GET  /api/teams/:team_id/analytics    -> { team_engagement, avg_completion_rate, top_performers:[] }  [admin]
```

---

## Sprint Breakdown (10 weeks, 5 sprints)

### Sprint 1 (Weeks 9–10): Auth & Cloud Sync Foundation
Supabase Auth (email/Google/Apple) · bi-directional activities sync · activity-logs sync · conflict resolution (latest-write-wins + notify) · user profile table · local→cloud migration (Phase 1→2 upgrade path). DevOps: Supabase project (PG/Auth/Storage), GH Actions backend, Sentry backend.
- **AC:** sign up/in via email/Google/Apple · local data auto-migrates on first login · bi-directional sync · conflicts graceful · offline sync queue · no data loss · local-only users still work (no forced sign-up).
- **QA exit:** 100% auth pass · sync on slow networks (3G/WiFi congestion) · migration verified · zero data loss.

### Sprint 2 (Weeks 11–12): Analytics Deep-Dive
Daily analytics aggregation · time-of-day heatmap · goal vs actual chart · category breakdown · subject-wise progress (exam) · WoW trends · charts UI (react-native-chart-kit or similar) · CSV/PDF export. DevOps: analytics DB query optimization + monitoring.
- **AC:** accurate heatmap · goal vs actual chart · category sums to 100% · accurate subject progress · WoW trends · charts < 1s · valid CSV / readable PDF · daily refresh (no stale data).
- **QA exit:** accuracy spot-checked vs raw data · charts on all sizes · export multi-device · no perf issues on large datasets.

### Sprint 3 (Weeks 13–14): WhatsApp-First Social + Friends
Streak card generation (9:16) · weekly summary card · WhatsApp share (RN Share API) · friends list + add flow · friends leaderboard · friend challenge creation · weekly auto-challenge generation · challenge tracking (progress/completion/reward).
- **AC:** 9:16 streak cards · accurate weekly summary · WhatsApp opens chat selection · add friend by username/id · correct leaderboard ranking · accurate challenge progress · auto-challenges every Sunday · share tracking analytics.
- **QA exit:** cards on various screens · WhatsApp on iOS+Android · friends features with real users · challenge logic verified.

### Sprint 4 (Weeks 15–16): Monetization + Gamification Full
BA: Pro upgrade/lifetime/XP level-up/college discount/level progression stories. Dev: Razorpay (UPI/cards/wallets) · subscription state (Pro monthly/yearly/lifetime) · feature gating (free vs Pro) · XP/points system · level calculation (cumulative XP→level) · level progression UI · seasonal quests (cricket-themed) · app themes (unlock by milestones) · in-app ads for free tier. DevOps: Razorpay webhook handling + recurring payment logic.
- **AC:** Razorpay payment processed · UPI Autopay works (GPay/PhonePe/Paytm) · subscription persists after payment · Pro features immediately unlocked · ads show for free/hidden for Pro · XP earned per log · level-up animations trigger · seasonal quests reward XP · themes unlock at milestones · .edu college discount verified · lifetime limited 1/user.
- **QA exit:** E2E payment (Razorpay sandbox) · subscription state in DB · feature gating tested as free user · XP/level spot-checked · ads non-intrusive.

### Sprint 5 (Weeks 17–18): Corporate Wellness B2B + Platform Features + Launch Prep
BA/PM: team workspace stories + marketing collateral (Phase 2 screenshots, Pro pricing comms, B2B deck). Dev: team workspace creation · bulk CSV invite + email invites · team leaderboard · team challenges (admin creates, members track) · manager dashboard (anonymized) · Google Workspace SSO · home screen widget (iOS + Android) · Apple Health (HealthKit) · Google Fit · Siri/Google Assistant shortcuts. QA: all team features + health integrations + full Phase 1+2 regression + perf testing. DevOps: app store update, TestFlight+Open Testing beta, Sentry B2B monitoring, launch checklist.
- **AC:** team workspace ≤500 members · CSV bulk invite 100+ emails in < 10s · real-time team leaderboard · admin team challenges · anonymized manager dashboard · Google Workspace SSO works · widget updates on activity log · Apple Health steps sync ≤5 min · Google Fit workouts auto-logged · Siri/GA voice commands work · all Phase 1 features still pass · app perf with team data acceptable · privacy policy updated · store packages ready · 2-week beta live.
- **QA exit / Go-No-Go:** 100% test cases pass (Phase 1+2) · zero critical bugs · zero high bugs (or accepted risk) · perf verified (leaderboards 500+ users) · regression complete · release readiness approved · **Go/No-Go decision made**.

---

## Marketing & Launch Strategy
- **W15:** announce Pro tier in-app · **W16:** email Phase 1 users, early-bird discount · **W17:** launch Pro with 1-week free trial · lifetime deal: limited 500 purchases.
- **Social:** WhatsApp sharing target 40% of DAU · Instagram Reels (friend challenges) · exam communities (Physics Wallah, Unacademy) · fitness influencer partnerships.
- **B2B:** reach out W14 to 10 pilot companies · W17–18 conduct 5 demos, close 2–3 pilots · target ₹10L B2B ARR by end of Phase 2.

## Success Metrics
- **MAU:** 50K → 150K (3×) · **DAU:** 10K → 30K · Day-60 retention 25% → 30%
- **Pro conversion:** 8% of MAU (1,200 paying users) · lifetime sales ₹25–30L · **Consumer ARR:** ₹40L+ · **B2B ARR:** ₹10L+ · **Total ARR:** ₹50L
- **Engagement:** WhatsApp sharing ≥40% of DAU · friend add rate ≥30% new users · weekly challenge completion ≥70% active users · ≥5 corporate accounts with 50+ employees
- **Technical:** sync reliability 99.9% · cloud migration 100% no data loss · payment success ≥98% · team leaderboard load < 1s (500+ users)

## Risks & Mitigations
1. **Cloud sync conflicts** (Med/Med) → clear conflict resolution, notify users, prefer local if uncertain.
2. **Razorpay failures / UPI issues** (Med/High) → retry logic, JusPay/Stripe fallback, extensive testing.
3. **Team workspace complexity underestimated** (Med/Med) → simplify MVP (email invite only; defer Google Workspace SSO to Phase 2.5).
4. **Corporate sales cycle slow** (High/Med) → start outreach W14 (early); partner with Pluxee; bundle with health insurance.
5. **Health app integrations cause battery drain** (Low/Med) → background sync on WiFi only, 1–2h sync interval max.

## Budget (~₹5.32L excluding team salary)
- Infra (Supabase + Node.js API + CDN): ~₹17,000/mo × 2.5 = ₹42,500
- Razorpay fees: 2% of ₹40L = ₹80,000
- Marketing (influencer × 5 + social + Google Ads): ₹1,10,000
- B2B sales (collateral + onboarding): ₹30,000
- Localization (5 more regional languages): ₹2,00,000
- Misc (design + legal): ₹70,000
- **Total: ~₹5,32,500** — self-funded from Phase 1 revenue (₹40L ARR).

## Phase 2 → Phase 3 Handoff (end Week 18)
- 150K MAU, 30K DAU · ₹50L ARR · 30% Day-60 retention · 5+ corporate wellness customers · stable cloud sync · social driving 40% WhatsApp share rate.
- **Ready for Phase 3:** AI coach insights (weekly reviews, nudges) · mood & wellbeing · vrat/spiritual features · Premium+ tier (₹149/mo) · AI-driven personalization.
