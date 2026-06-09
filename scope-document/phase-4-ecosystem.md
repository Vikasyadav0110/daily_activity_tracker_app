# Daily Activity Tracker — Phase 4 Ecosystem Scope of Work

> **Source of truth for Phase 4 (Weeks 31–48, 18 weeks / 4.5 months).** Pasted from Vikas's Phase 4 execution plan on 2026-06-08. Complete.
> **Prerequisite:** Phase 3 completed with 300K MAU, ₹1.4Cr ARR.
> **Tech Stack:** Phase 3 stack + Next.js (web) + Stripe (B2B billing) + Vercel (hosting).

---

## Phase 4 Overview

Phases 1–3 built the mobile app. Phase 4 expands into:
1. Full web application (Next.js) — feature parity with mobile
2. B2B Team scaling — enterprise features, SSO, bulk management
3. Third-party integrations — Zapier, Slack, Google Calendar, Notion
4. Public REST API — let developers build on platform
5. Strategic partnerships — edtech (Unacademy), fitness (Cult.fit), insurance
6. Geographic expansion — South India (Tamil Nadu, Telangana, Karnataka)
7. Marketplace — courses, habit programs from partners
8. Advanced B2B analytics — wellness dashboards for large enterprises

### Target Outcome / Success Metrics
- **MAU:** 300K → 600K+ (2×) · **DAU:** 60K → 120K+ · Web DAU = 25% of total · Day-180 retention 35% → 50%
- **Consumer ARR:** ₹90L → ₹3Cr · **B2B ARR:** ₹50L → ₹2Cr · **Total ARR:** ₹5Cr+
- **API revenue:** $50–100K/mo · partnership revenue ₹50–100L · marketplace ₹20–50L
- **Ecosystem:** 1,000+ API developers · 50 → 500+ enterprise customers · 10+ integrations · 100+ marketplace programs · 1,000+ Zaps
- **Technical:** API uptime 99.99% · API p99 < 200ms · web Lighthouse > 80 · supports 1M+ DAU
- **Market:** leader in India habit tracking + corporate wellness

---

## Feature Breakdown

### FS1: Web Application (Next.js, feature parity)
- **Must:** web dashboard (Next.js + TS) · full activity CRUD · complete analytics (goal vs actual, heatmap, trends) · friend management + leaderboards · challenge tracking · subscription management (upgrade/cancel/billing history) · settings (lang/theme/notifications/privacy) · mood tracking · vrat/pooja tracking · AI insights (weekly reviews) · smart scheduling view/edit.
- **Nice:** offline PWA (service worker) · desktop/browser push · keyboard shortcuts · bulk activity CSV import · analytics export (JSON/CSV) · email weekly digest.
- **Tech:** Next.js 14+ (RSC where beneficial) · Tailwind CSS · React Context or Zustand · Supabase PostgreSQL (same backend) · Supabase Auth (same sessions) · Vercel hosting (auto-deploy from GitHub) · PostHog · Sentry.

### FS2: B2B Team Workspaces (Enterprise)
- **Must:** workspace management · member roles (admin/manager/member) · bulk CSV invite (1,000+ employees) · real-time team leaderboard · admin-created company-wide challenges · manager analytics (anonymized) · department-level reporting · SSO (Google Workspace, Microsoft 365, Okta) · SAML · audit logs · data export (compliance).
- **Nice:** Slack/Teams integration · calendar sync · manager email digest · custom themes (company branding) · white-label option.
- **Pricing:** ₹199/seat/mo (min 10 seats) · volume discounts (100+ seats 15% off; 500+ 25% off) · annual contracts 20–30% off · custom pricing for 1,000+ seats.

### FS3: Third-Party Integrations
- **Must (4.1):** Zapier connector (trigger on log → actions) · Google Calendar (bi-directional) · Notion (push daily summary) · Slack bot (log + reminders).
- **Nice (4.2+):** IFTTT · Telegram · Discord · Microsoft Teams · Jira.
- **Tech:** documented rate-limited REST API · webhooks (real-time events) · OAuth2 · API key management (rate limits per key) · Swagger/OpenAPI docs.

### FS4: Public REST API (`/api/v1`)
```
[AUTH]      POST /auth/signup · /auth/signin · /auth/refresh
[ACTIVITIES] GET/POST /activities · PATCH/DELETE /activities/:id
[LOGS]      GET/POST /activities/:id/logs · PATCH/DELETE /logs/:log_id
[ANALYTICS] GET /analytics/summary · /analytics/trends · /analytics/correlation
[SOCIAL]    GET /friends · POST /friends/:friend_id/challenge · GET /leaderboard
[INSIGHTS]  GET /insights/latest · /insights/history
```
- **Docs:** OpenAPI/Swagger · code examples (Python/JS/cURL) · webhook docs · rate limits/auth/error handling · SDKs (JS, Python, Go).
- **Pricing:** Free 1,000 req/mo · Pro $9/mo (10,000 req/mo) · Enterprise custom (webhook, priority support).

### FS5: Strategic Partnerships
- **Edtech:** Unacademy (white-label study tracker) · Physics Wallah (co-branded exam prep) · BYJU'S · coding bootcamps (track coding hours).
- **Fitness/Wellness:** Cult.fit (sync workouts) · HealthifyMe (nutrition share) · FITTR (co-marketing) · yoga studios (class booking + tracking).
- **Corporate/Insurance:** HDFC Ergo (premium discounts for active users) · Star Health · Apollo 247 · benefits platforms (Pluxee, Aon, Willis Towers Watson).
- **Geographic/Regional:** regional YouTubers/influencers · yoga centers/temples · college CSR programs.

### FS6: Marketplace (4.2+)
- **Content:** habit programs ("30-day fitness", "JEE study plan") · wellness courses (Ayurveda, meditation) · live coach programs.
- **Monetization:** revenue share 70% creator / 30% DAT · featured placement $500–2,000/mo · sponsored programs.

### FS7: Geographic Expansion (South India first)
- **Focus:** Tamil Nadu, Telangana, Karnataka (Tier 1+2).
- **Localization:** Tamil + Kannada (full UI + content) · regional partnerships · local influencer marketing · South Indian festivals/regional sports.
- **Market entry:** Bangalore (IT) · Hyderabad (tech/edtech, Unacademy HQ) · Chennai (fitness/edtech) · Tier 2 (Kochi, Coimbatore, Visakhapatnam).

---

## Database Schema Additions (Phase 4)

```sql
-- api_keys
api_keys (id PK, user_id FK, key_hash UNIQUE /*hashed, never plain*/, key_name,
       tier /*free|pro|enterprise*/, requests_this_month DEFAULT 0, rate_limit,
       status /*active|revoked*/, last_used_at, created_at, expires_at?)

-- api_logs
api_logs (id PK, api_key_id FK, endpoint, method, status_code,
       response_time_ms, timestamp)

-- integrations
integrations (id PK, user_id FK, integration_type /*zapier|google_calendar|slack|notion*/,
       status /*connected|disconnected|error*/, external_account_id,
       auth_token /*encrypted*/, config JSON, last_sync, created_at)

-- marketplace_programs
marketplace_programs (id PK, creator_user_id FK, program_name, program_description,
       category /*fitness|study|wellness|spiritual*/, activities JSON, duration_days,
       price DECIMAL /*INR*/, icon_url, cover_image_url, rating REAL, review_count,
       sales_count, status /*draft|published|archived*/, revenue_share_pct /*70*/,
       featured DEFAULT 0, featured_until?, created_at)

-- program_enrollments
program_enrollments (id PK, user_id FK, program_id FK, enrollment_date,
       status /*active|completed|abandoned*/, progress_pct, created_at,
       UNIQUE(user_id, program_id))

-- enterprise_contracts
enterprise_contracts (id PK, team_id FK, contract_start_date, contract_end_date,
       seats_count, price_per_seat DECIMAL, discount_pct /*0-30*/,
       total_contract_value DECIMAL, billing_contact, technical_contact,
       sso_provider /*google_workspace|microsoft_365|okta*/,
       status /*active|renewal_pending|expired*/, created_at)
```

---

## Sprint Breakdown (18 weeks, 9 sprints)

### Sprint 1 (Weeks 31–32): Web App Foundation + Auth + Core
Next.js setup (TS/Tailwind) · web auth (Supabase, sessions) · responsive design · activity CRUD · activity logs · web dark mode · Vercel CI/CD. DevOps: Vercel deploy, env vars, PostHog/Sentry.
- **AC:** live at app.dailyactivitytracker.com · auth (login/signup/forgot) · web logging · mobile↔web sync (real/near-real-time) · responsive · dark mode · page loads < 3s.

### Sprint 2 (Weeks 33–34): Web Analytics + Dashboard
Analytics dashboard (goal vs actual, heatmap, trends) · weekly AI review display · mood tracking (log/history/charts) · smart schedule viewer · friend leaderboard (web) · challenge tracker (web).
- **AC:** all analytics on web · charts < 2s · real-time leaderboards · no mobile/web data discrepancies.

### Sprint 3 (Weeks 35–36): REST API v1 + Documentation
Auth/activities/logs/analytics/social/insights endpoints · rate limiting + API key management · OpenAPI/Swagger docs · code examples (Python/JS/cURL). DevOps: API monitoring.
- **AC:** core endpoints implemented · documented · rate limiting (1,000 req/mo free) · keys hashed · multi-language examples · clear errors.

### Sprint 4 (Weeks 37–38): Third-Party Integrations
Zapier connector · Google Calendar (bi-directional) · Slack bot (log/reminders/leaderboard) · Notion (push daily summary) · OAuth2 · integration management UI.
- **AC:** Zapier live · Calendar real-time · Slack bot responding · Notion pushing · OAuth2 secure (encrypted, refresh) · intuitive management UI.

### Sprint 5 (Weeks 39–40): B2B Enterprise (SSO, Audit, Bulk)
Google Workspace SSO (SAML) · Microsoft 365 SSO (SAML/OAuth2) · Okta (optional) · bulk CSV import (1,000+) · department/org hierarchy · audit logs · data export (CSV/JSON) · deprovisioning · billing changes (seat/tier).
- **AC:** SSO works (real G Suite/M365) · CSV 1,000+ in < 5 min · duplicate handling · complete audit logs · valid export · clean offboarding · automated seat billing.

### Sprint 6 (Weeks 41–42): B2B Advanced Analytics + Manager Dashboard
Manager analytics (anonymized) · department-level reporting · wellness trends (engagement %, mood, activity) · manager insights (top performers, at-risk) · scheduled email reports · custom report builder.
- **AC:** anonymized dashboard · accurate dept breakdowns · correct trends · actionable insights · on-time formatted emails · **privacy verified (no individual exposure)** · correct custom reports.

### Sprint 7 (Weeks 43–44): Marketplace + Developer Portal
Marketplace frontend (browse/purchase) · creator tools · enrollment tracking · marketplace payments (Razorpay) · revenue tracking + creator payouts · developer portal (key gen, usage dashboard) · webhook testing tool.
- **AC:** programs discoverable/purchasable · enrollment auto-creates activities · progress tracked · payouts 70/30 correct · functional dev portal · working webhooks.

### Sprint 8 (Weeks 45–46): Partnerships + Geographic Expansion
PM: formalize agreements (Unacademy, Cult.fit…) + launch plans (co-marketing, rev share). Dev: Unacademy white-label · Cult.fit workout sync · HealthifyMe nutrition share · regional server/CDN (South India) · Tamil + Kannada UI · regional partner onboarding (studios, yoga centers).
- **AC:** integrations live · automated rev share · Tamil/Kannada complete + tested · regional CDN (lower latency) · regional partnerships operational.

### Sprint 9 (Weeks 47–48): Final Regression + Scale Testing + Launch Prep
QA: full regression (all Phases 1–4) · load testing (1M DAU) · security testing (API/web/mobile) · penetration testing (3rd-party firm) · enterprise UAT. PM: ecosystem/API/web/enterprise launch campaigns. Dev: perf optimization. DevOps: infra scaling (Supabase/Vercel/CDN) · DR + backup testing · runbook · production monitoring (Datadog, PagerDuty).
- **AC:** regression pass · 1M DAU load no degradation · pen-test passed · enterprise UAT approved · web Lighthouse > 80 · API p99 < 200ms · DR tested · monitoring + alerts configured.
- **QA exit / Go-No-Go:** 100% regression · load success · no critical vulns · enterprise UAT signed · **GO**.

---

## Marketing & Launch Strategy
- W43 announce partnerships · W44 launch marketplace + creator program · W45 launch REST API + developer program · W46 launch web app · W47 enterprise sales push · W48 South India launch.
- **Growth levers:** API developer community · partnership ecosystem · enterprise sales (50→500+) · web/desktop penetration.

## Risks & Mitigations
1. **Web perf lags mobile** (Med/Med) → mobile-first + progressive enhancement, perf budgets, profiling.
2. **API misuse/scraping** (Med/Med) → strict rate limiting, key monitoring, ToS enforcement, abuse detection.
3. **Enterprise security audit failures** (Low/High) → SOC2 audit early (W40), pen-testing, security docs, compliance team.
4. **Partnership integration complexity** (Med/Med) → phased rollout (Zapier first), dedicated partnership engineer, rigorous testing.
5. **Slow API adoption** (Med/Med) → generous free tier, developer education, community forum, hackathon.
6. **Slow geographic expansion** (Med/Low) → partner-led (Unacademy/Cult.fit), regional influencers, localized pricing.

## Budget (Phase 4)
Web dev ₹1.5L · REST API ₹50K · integrations ₹1L + OAuth2 review ₹20K · enterprise SSO ₹80K + audit/export ₹30K · dev portal ₹50K · **security/compliance** (SOC2 ₹2L + pen-test ₹1L + GDPR ₹50K) · infra scaling (Supabase ₹90K + CDN ₹30K + monitoring ₹30K) · marketplace ₹80K · partnerships/BD (legal ₹2L + sales team 2×4.5mo ₹10L + onboarding ₹2L) · marketing/launch ₹3L · South India localization ₹2L · misc ₹2L.
**Total: ~₹15L + ₹10L sales team = ₹25L** (+ team salary). Largely self-funded from Phase 3 revenue.

## Post-Phase 4 / Future Horizons
End state: 600K+ MAU, 120K+ DAU, ₹5Cr+ ARR, 500+ enterprise customers, 1,000+ API developers, 50+ partnerships, India market leader.
Phase 5+ candidates: global expansion (US/Europe/SEA) · wearable support · health system integrations (EHR) · AI coaching scaling (Claude → open-source) · IPO readiness (₹10Cr+ ARR).
