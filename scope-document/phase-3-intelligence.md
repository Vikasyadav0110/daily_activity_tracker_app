# Daily Activity Tracker — Phase 3 Intelligence Scope of Work

> **Source of truth for Phase 3 (Weeks 19–30, 12 weeks / 3 months).** Pasted from Vikas's Phase 3 execution plan on 2026-06-08. Complete.
> **Prerequisite:** Phase 2 completed with 150K MAU, ₹50L ARR.
> **Tech Stack:** Phase 2 stack + Anthropic Claude API (AI insights) + Firebase ML Kit (optional).

---

## Phase 3 Overview

Phase 1 shipped core tracking. Phase 2 added sync + social. Phase 3 makes the app feel like a personal coach.

Key additions:
1. AI Weekly Review (Claude API) — automated insights from activity patterns
2. AI Coach Nudges — re-engagement when users go inactive
3. Mood & Wellbeing Tracking — correlate mood with activities
4. Vrat/Fasting Tracker — Ekadashi, Karwa Chauth, Navratri, Ramadan
5. Pooja/Mantra Counter — digital mala, prayer tracking
6. Ayurveda Tips — seasonal wellness recommendations
7. Smart Scheduling — AI suggests optimal daily plan
8. Premium+ Tier — ₹149/month at higher margins
9. India spiritual expansion — reach underserved wellness segment

### Success Metrics
- **MAU:** 150K → 300K (2×) · **DAU:** 30K → 60K · Day-90 retention 30% → 35% · NPS ≥ 50
- **Premium+ conversion:** 5% of MAU = 15,000 users @ ₹149/mo = ₹2.68Cr ARR
- **AI engagement:** 70% of Premium+ users open weekly review · coach message response 60% → activity log
- **Consumer ARR:** ₹90L+ · **B2B ARR:** ₹50L+ (100+ corporate accounts) · **Total ARR:** ₹1.4Cr
- **Corporate:** 50+ accounts (Phase 2) → 100 (Phase 3)
- **Claude API cost:** < ₹2/user/week · insight latency < 5s

---

## Feature Breakdown

### FS1: AI Weekly Review (Claude API)
- **Must:** automated weekly in-app/email insight every Monday · pattern detection ("40% more active Tuesdays") · correlation analysis ("sleep < 6h → gym skip 80%") · positive reinforcement (genuine, not generic) · trend analysis (WoW study hours) · exam subject weak-spot ID ("Constitutional Law needs 2× more study").
- **Nice:** shareable insight cards (9:16 WhatsApp) · predictive recommendations ("finish UPSC syllabus by [date]") · mood correlation ("mood 30% higher on exercise days") · personalized pep-talk.
- **Tech:** Claude API call with last-week activity logs · cache results (no duplicate calls in 24h) · store insights in DB · generate shareable graphics from insight data.

### FS2: AI Coach Nudge (Smart Re-engagement)
- **Must:** miss-streak detection (2+ days missed → AI-generated push) · plan recalibration (every Monday, AI adjusts targets based on adherence) · event-based cues ("after breakfast → log workout") · smart timing (AI learns receptive window) · exam nudges ("on track / need to focus on [subject]").
- **Nice:** voice-based encouragement (AI-generated audio) · friend comparison ("your friend did 5 workouts, you did 2") · streak predictions ("3 more days → 30-day badge").
- **Tech:** track inactivity (days since last log) → call Claude with context → push with 1-tap log action → A/B test message styles (humorous vs serious).

### FS3: Mood & Wellbeing Tracking
- **Must:** daily mood check-in (1-tap, 5 emoji levels 😞→😄) · energy scale (1–5 mornings) · mood-activity correlation ("gym days → +30% mood") · sleep quality (1–5) · mood history chart (30 days).
- **Nice:** journal notes (1–2 sentence reflections) · mood-triggered insights · seasonal mood trends · mental health resources (link to counseling if consistently low).
- **Tech:** `mood_logs` table · daily smart-timed prompt · line graph chart · Pearson correlation (mood vs activity completion).

### FS4: Vrat/Fasting Tracker (Spiritual)
- **Must:** vrat calendar (auto-populate Ekadashi, Karwa Chauth, Navratri, Ramadan, etc.) · fasting log (start/break times) · fasting streak (consecutive days/weeks) · fasting preparation tracker · breaking reminder (alert when vrat ends) · fasting mood correlation.
- **Nice:** auspicious time calculator (Brahma Muhurta, Pitru Paksha) · vrat-specific recipes · family vrat tracking · spiritual benefits tracker ("Completed 30 Ekadashi fasts").
- **Tech:** `fasts` table · Hindu calendar API (Ekadashi dates, Tithi) · timezone-aware Brahma Muhurta · push for vrat start/end.

### FS5: Pooja & Mantra Counter (Digital Mala)
- **Must:** mantra counter (flexible: "108 Surya Namaskar", "1000 Om") · pooja streak · pooja history · auspicious time alerts (Brahma Muhurta).
- **Nice:** voice input mantra counting (experimental) · pooja calendar (festival dates) · shared family pooja · "365 days of daily pooja" badge.
- **Tech:** extend activities table with `mantra_count`, `mantra_name` · `mantra_logs` table · festival calendar integration.

### FS6: Ayurveda & Seasonal Wellness Tips
- **Must:** daily wellness tip (Daadi-maa wisdom: haldi doodh, oil massage) · seasonal recommendations (summer: cooling, winter: warming) · dosha-based suggestions (Vata/Pitta/Kapha) · Ayurvedic food database · seasonal activity recommendations.
- **Nice:** dosha quiz · Ayurveda + mood correlation · regional tips (South India: coconut, North India: wheat).
- **Tech:** curated tips DB (100+ tips, seasonal, dosha-tagged) · dosha quiz/heuristic · localized daily tip push.

### FS7: Smart Scheduling (AI-Powered)
- **Must:** AI schedule builder (user inputs free time + goals → Claude proposes plan) · conflict detection · adaptive difficulty (gradual target increases) · rest day suggestions · optimal timing based on patterns.
- **Nice:** time blocking · multi-day/weekly optimization · habit stacking ("after breakfast → gym").
- **Tech:** Claude API call with goals + free time → generate schedule → store as suggested plan → track adherence → refine next week.

### FS8: Premium+ Tier

| Tier | Price | Key Features |
|---|---|---|
| **Free** | ₹0/mo | core tracking (Phase 1 free limits) |
| **Pro** | ₹49/mo or ₹399/yr | unlimited activities, cloud sync, ad-free |
| **Lifetime Pro** | ₹999 one-time | everything Pro forever |
| **Premium+** | ₹149/mo or ₹1,490/yr | all Pro + AI weekly review, AI coach, mood tracking, full vrat/pooja, Ayurveda tips, smart scheduling, priority support (24h), early access |
| **Family** (5) | ₹299/mo | Pro features for 5 members |

- **Tech:** new Razorpay subscription tier · Premium+ feature gating throughout app · upgrade prompts targeting free/Pro users · 14-day free trial option.

---

## Database Schema Additions (Phase 3)

```sql
-- mood_logs
mood_logs (id PK, user_id FK, date /*YYYY-MM-DD*/, mood_rating /*1-5*/,
       energy_level /*1-5*/, sleep_quality /*1-5, nullable*/, notes?,
       created_at, UNIQUE(user_id, date))

-- fasts
fasts (id PK, user_id FK, vrat_name /*Ekadashi|Karwa Chauth|Navratri|Ramadan…*/,
       start_date, end_date, start_time /*HH:MM*/, end_time /*HH:MM*/,
       status /*planned|in_progress|completed*/, mood_rating /*1-5*/, notes?,
       created_at)

-- mantra_logs
mantra_logs (id PK, user_id FK, activity_id FK?,
       mantra_name /*Om|Gayatri|Hanuman Chalisa|Surya Namaskar*/,
       count, duration_minutes?, date /*YYYY-MM-DD*/, created_at)

-- ai_insights
ai_insights (id PK, user_id FK, insight_week_start /*YYYY-MM-DD Monday*/,
       insight_type /*weekly_review|pattern|recommendation*/,
       insight_title, insight_text /*Claude-generated*/, insight_data JSON,
       xp_reward, was_acted_upon DEFAULT 0, created_at, viewed_at?)

-- ai_coach_messages
ai_coach_messages (id PK, user_id FK,
       message_type /*miss_streak|plan_recalibration|encouragement*/,
       message_text /*Claude-generated*/, triggered_reason /*missed_2_days|low_completion*/,
       was_sent_at, was_opened DEFAULT 0, user_acted DEFAULT 0, created_at)

-- scheduled_plans
scheduled_plans (id PK, user_id FK, plan_name, plan_json JSON,
       plan_type /*ai_generated|user_custom*/, status /*active|archived*/,
       adherence_rate REAL, start_date, created_at)

-- wellness_tips
wellness_tips (id PK, tip_text, tip_category /*ayurveda|seasonal|general_wellness*/,
       season? /*summer|monsoon|winter|spring*/, dosha? /*vata|pitta|kapha*/,
       language, display_order, created_at)

-- dosha_profiles
dosha_profiles (id PK, user_id UNIQUE FK, primary_dosha /*vata|pitta|kapha*/,
       secondary_dosha?, dosha_determined_via /*quiz|admin*/, created_at)
```

---

## API Specification (Phase 3)

### AI Insights (Premium+, Bearer)
```
GET  /api/insights/weekly/:week_start  ?week_start=YYYY-MM-DD
     -> { insight_title, insight_text, insights:[{type,text}], xp_earned }
GET  /api/insights/history
     -> [{ week_start, insight_title, viewed_at, acted_upon }]
POST /api/insights/:insight_id/view   -> { insight_id, viewed:true }
POST /api/insights/:insight_id/act    { action_taken } -> { xp_awarded:50 }
```

### Coach Messages (Premium+, Bearer)
```
GET  /api/coach/pending-messages      -> [{ message_id, type, text, triggered_reason, can_dismiss }]
POST /api/coach/message/:id/open      -> { message_id, opened:true }
POST /api/coach/message/:id/action    { action:log_activity|dismiss } -> { action_recorded }
```

### Mood Tracking (Bearer)
```
POST /api/mood/log                { date, mood_rating:1-5, energy:1-5, sleep:1-5, notes? } -> { mood_log_id }
GET  /api/mood/history/:period    ?period=7d|30d|all&activity_id? -> [{ date, mood, energy, sleep, correlated_activity }]
GET  /api/mood/trends             (Premium+) -> { avg_mood, mood_correlation:[{ activity, correlation, sample_size }] }
```

### Vrat/Fasting (optional auth for calendar)
```
GET  /api/vrat/calendar/:year_month  -> [{ vrat_date, vrat_name, description }]
POST /api/vrat/log                   { vrat_name, start_date, start_time, end_date, end_time, mood_rating, notes } -> { fast_id, status }
GET  /api/vrat/history               -> [{ vrat_name, date, status, mood_rating }]
GET  /api/vrat/streaks               -> { ekadashi_streak, karwa_chauth_streak, total_fasts }
```

### Mantra Counter (Bearer)
```
POST /api/mantra/log        { mantra_name, count, duration_minutes, date } -> { mantra_log_id }
GET  /api/mantra/history    -> [{ date, mantra, count, duration, total_time }]
GET  /api/mantra/milestones -> [{ milestone, achieved, achieved_date?, progress_pct? }]
```

### Wellness Tips (auth optional)
```
GET /api/wellness/daily-tip      ?date=YYYY-MM-DD -> { tip_text, category }
GET /api/wellness/tips/:category ?season?&dosha? -> [{ tip_id, tip_text, category, season }]
```

### Smart Scheduling (Premium+, Bearer)
```
POST /api/schedule/generate  { goals:["UPSC study 4h","Gym 1h"], available_hours:7, timezone }
     -> { suggested_schedule:[{time,activity,duration}], note }
POST /api/schedule/save      { plan_name, plan_json, activities:[] } -> { plan_id, status:active }
GET  /api/schedule/adherence/:plan_id -> { plan_id, adherence_rate, completed_days, total_days }
```

### Dosha / Profile (Bearer)
```
POST /api/dosha/quiz    { answers:[...] } -> { primary_dosha, secondary_dosha }
GET  /api/dosha/profile -> { primary_dosha, secondary_dosha, tips:[] }
```

---

## Sprint Breakdown (12 weeks, 6 sprints)

### Sprint 1 (Weeks 19–20): AI Weekly Review + Claude API Integration
BA: user stories for AI weekly review + shareable insight cards. Dev: Claude API auth + rate limiting · weekly review generation (Claude call with weekly data) · insight parsing + storage · insight UI (review card + detail) · shareable 9:16 graphics · 24h caching. DevOps: Claude API cost monitoring + fallback mechanism.
- **AC:** Claude integration working · reviews generated every Monday for Premium+ · insights reference real activities · share graphics error-free · no duplicate Claude calls in 24h · cost per user/week acceptable (₹1–2) · text-only fallback if API fails.
- **QA exit:** integration tested with real data · accuracy spot-checked · graphics on multiple devices · API latency < 5s.

### Sprint 2 (Weeks 21–22): Mood & Wellbeing + Correlation
BA: user stories for mood tracking, trends, correlations. Dev: emoji-based 1-tap mood check-in (smart timing) · mood logging (SQLite + cloud sync) · 30-day line chart · Pearson correlation calculation · correlation UI (top 3 mood-boosting activities) · energy + sleep logging · mood-triggered insights.
- **AC:** daily check-in (non-intrusive) · data persists + syncs · 30-day chart · correlations correct (verified manually) · top-3 UI · no perf issues on large datasets.
- **QA exit:** end-to-end verified · correlation algorithm tested with sample data · charts on all devices · no lost mood logs.

### Sprint 3 (Weeks 23–24): Vrat/Fasting + Pooja/Mantra (Spiritual)
BA: user stories for Ekadashi tracking, mantra counter, pooja streak, festival reminders. Dev: Hindu calendar API integration · vrat calendar + logging (start/end, mood) · vrat streak calculation · mantra counter · pooja activity enhancements · auspicious time alerts (Brahma Muhurta, timezone-aware) · festival calendar + reminders · fasting mood correlation.
- **AC:** vrat calendar accurate · fasts logged with times · streaks correct · flexible mantra counts · Brahma Muhurta timezone-aware · correct festival dates · timezone-correct reminders · fasting mood impact tracked.
- **QA exit:** vrat dates manually verified · mantra counter (1/108/1000) · Brahma Muhurta spot-checked (multiple cities) · festival reminders on real device.

### Sprint 4 (Weeks 25–26): Ayurveda Tips + Smart Scheduling + AI Coach Nudges
BA: user stories for daily Ayurveda tips, dosha-based recommendations, AI coach messages, smart scheduling. Dev: 100+ wellness tips DB (seasonal, dosha-tagged) · dosha quiz/heuristic · localized daily tip delivery · AI coach message generation (Claude + inactivity data) · smart message timing + tracking · Claude-powered schedule generator · conflict detection · adaptive difficulty (5–10% weekly target increase).
- **AC:** tips at optimal time + language-correct + season/dosha relevant · dosha quiz verified · coach messages sent at 2+ days inactive, personalized · schedule in < 5s, feasible, no overlaps · message engagement tracked (open% vs dismiss%).
- **QA exit:** tips multi-device · AI coach verified (Claude working) · schedule with various inputs · dosha validated · perf acceptable.

### Sprint 5 (Weeks 27–28): Premium+ Tier Launch + Subscription Management
PM: Premium+ marketing comms + upgrade flow + in-app nudges. Dev: Premium+ Razorpay subscription · feature gating (all AI/mood/vrat/Ayurveda locked) · tier-based UI (Premium+ exclusive badges) · subscription status display · 14-day free trial · renewal + cancellation flow. DevOps: Razorpay webhook for Premium+ renewals.
- **AC:** purchase flow working (Razorpay) · UPI Autopay recurring billing · all Premium+ features gated · renewal date + cancel option displayed · 14-day trial available · auto-renewal frictionless · clear cancellation with retention offer.
- **QA exit:** E2E payment (Razorpay sandbox) · feature gating verified as non-subscriber · state persists across restart · simulated renewal.

### Sprint 6 (Weeks 29–30): Full Regression + B2B Expansion + Launch Prep
BA: user onboarding docs (AI review, vrat tracking). PM: Phase 3 marketing collateral + Premium+ messaging + B2B deck (AI wellness for corporate). Dev: team challenges for Premium+ · mood tracking in team analytics (anonymized) · manager wellbeing insights · AI caching + mood data indexing. QA: full regression (Phase 1+2+3) · localization QA (hi/en/ta/te/bn) · performance (AI features, large datasets) · A/B testing (nudges, insights, Premium+ offers) · accessibility (VoiceOver/TalkBack). DevOps: app store update (screenshots/description) · TestFlight+Open Testing beta · Claude API cost monitoring · launch checklist.
- **AC:** all Phase 1+2+3 features pass · AI features working · Premium+ gating · vrat/pooja/Ayurveda culturally appropriate · all 5 languages · no AI-related slowdowns · accessibility basics · store packages ready · 2-week beta live · launch date confirmed.
- **QA exit / Go-No-Go:** 100% regression pass · zero critical bugs · zero high bugs (or accepted risk) · performance verified · localization sign-off · **GO**.

---

## Marketing & Launch Strategy
- **W25:** tease AI weekly review in-app (visible to free/Pro) · **W26:** announce ₹149/mo Premium+ (email + push) · **W27:** offer 14-day free trial · **W28:** launch Premium+ on app stores.
- **B2B:** expand 50 → 100 corporate accounts; pitch AI wellness, mood tracking, personalized insights; channels: LinkedIn, HR events, Pluxee/Aon.
- **Spiritual/wellness:** promote vrat/pooja/Ayurveda to spiritual communities; partner with yoga studios, Ayurveda clinics; Hindi YouTube content.

## Risks & Mitigations
1. **Claude API costs exceed budget** (Med/High) → cache insights, batch, fallback, weekly cost monitoring.
2. **Vrat/pooja culturally inaccurate** (Low/High) → Hindi/regional cultural consultant, spiritual advisor review, real-user beta.
3. **Mood tracking privacy concerns** (Med/Med) → clear privacy policy, local storage option, no sharing without consent, full transparency.
4. **AI coach messages feel generic** (Med/Med) → A/B test styles, heavy personalization, engagement tracking, weekly iteration.
5. **Smart scheduling too complex / underused** (Low/Low) → simplify UX, templates, guided first-creation flow.

## Budget (~₹4.47L excluding team salary)
- Claude API ~₹22,500 (300K calls/mo × 3 months, ~$0.003/call est.)
- Infra scaling ₹45,000 (DB + analytics × 3 months)
- Localization ₹90,000 (Ayurveda tips + vrat/pooja content)
- Marketing ₹1,30,000 (Premium+ launch + B2B + influencer)
- Design & content ₹70,000 (wellness tips copy + spiritual design)
- Misc ₹40,000 (legal review spiritual/wellness claims + user research)
- **Total: ~₹4,47,500** — largely self-funded from Phase 2 revenue (₹50L ARR).

## Phase 3 → Phase 4 Handoff (end Week 30)
- 300K MAU, 60K DAU · ₹1.4Cr ARR · 35% Day-90 retention · NPS ≥ 50
- 100+ corporate wellness customers · Premium+ at 5% conversion · AI driving 70% Premium+ engagement · spiritual community growing (30% adoption)
- **Ready for Phase 4:** web app, enterprise team scaling, public API, 3rd-party integrations, marketplace, South India expansion.
