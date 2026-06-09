# Database Schema — All Phases

Complete database design for the Daily Activity Tracker across all 4 phases (33 tables total).

---

## File Index

| File | Purpose |
|---|---|
| [schema-overview.md](schema-overview.md) | **Master reference** — every table, every column, relationships, indexes, ERD |
| [migrations/phase-1-sqlite.sql](migrations/phase-1-sqlite.sql) | Phase 1 — SQLite DDL (offline-first, 8 tables) |
| [migrations/phase-2-postgres.sql](migrations/phase-2-postgres.sql) | Phase 2 — Supabase PostgreSQL additions (11 tables) |
| [migrations/phase-3-postgres.sql](migrations/phase-3-postgres.sql) | Phase 3 — Intelligence additions (8 tables) |
| [migrations/phase-4-postgres.sql](migrations/phase-4-postgres.sql) | Phase 4 — Ecosystem additions (6 tables) |

---

## Table Inventory by Phase

| # | Table | Phase | Database | Purpose |
|---|---|---|---|---|
| 1 | `activities` | 1 | SQLite | User's trackable activities |
| 2 | `activity_logs` | 1 | SQLite | Daily log entries per activity |
| 3 | `streaks` | 1 | SQLite | Streak state per activity (48h forgiveness) |
| 4 | `exam_prep` | 1 | SQLite | Exam mode metadata (UPSC/JEE/NEET/SSC/Banking) |
| 5 | `exam_logs` | 1 | SQLite | Study session logs per exam |
| 6 | `mock_tests` | 1 | SQLite | Mock test scores + trends |
| 7 | `badges` | 1 | SQLite | Gamification badges (earned/unearned) |
| 8 | `app_settings` | 1 | SQLite | User preferences (language, theme, notifications) |
| 9 | `users` | 2 | PostgreSQL | Cloud auth identity (Supabase Auth) |
| 10 | `user_profiles` | 2 | PostgreSQL | Extended user profile + visibility settings |
| 11 | `friends` | 2 | PostgreSQL | Friend relationships (pending/accepted/blocked) |
| 12 | `leaderboards` | 2 | PostgreSQL | XP rankings (weekly/monthly/all-time) |
| 13 | `challenges` | 2 | PostgreSQL | Individual + friend + team challenges |
| 14 | `shares` | 2 | PostgreSQL | Share events (streak cards, weekly summaries) |
| 15 | `subscriptions` | 2 | PostgreSQL | Subscription state (Pro/Lifetime/Premium+/Family) |
| 16 | `team_workspaces` | 2 | PostgreSQL | Corporate B2B team containers |
| 17 | `team_members` | 2 | PostgreSQL | Team membership + roles |
| 18 | `team_challenges` | 2 | PostgreSQL | Admin-created company-wide challenges |
| 19 | `analytics_daily` | 2 | PostgreSQL | Pre-aggregated daily stats per user |
| 20 | `mood_logs` | 3 | PostgreSQL | Daily mood/energy/sleep check-ins |
| 21 | `fasts` | 3 | PostgreSQL | Vrat/fasting events (Ekadashi, Navratri, Ramadan…) |
| 22 | `mantra_logs` | 3 | PostgreSQL | Mantra/pooja count sessions |
| 23 | `ai_insights` | 3 | PostgreSQL | Claude-generated weekly review insights |
| 24 | `ai_coach_messages` | 3 | PostgreSQL | AI-generated re-engagement nudges |
| 25 | `scheduled_plans` | 3 | PostgreSQL | AI-generated or user-custom daily plans |
| 26 | `wellness_tips` | 3 | PostgreSQL | Curated Ayurveda/seasonal tips |
| 27 | `dosha_profiles` | 3 | PostgreSQL | User Ayurvedic constitution (Vata/Pitta/Kapha) |
| 28 | `api_keys` | 4 | PostgreSQL | Developer API key management |
| 29 | `api_logs` | 4 | PostgreSQL | API request audit log |
| 30 | `integrations` | 4 | PostgreSQL | Third-party connections (Zapier/Slack/Calendar/Notion) |
| 31 | `marketplace_programs` | 4 | PostgreSQL | Creator-published habit programs |
| 32 | `program_enrollments` | 4 | PostgreSQL | User enrollment + progress in programs |
| 33 | `enterprise_contracts` | 4 | PostgreSQL | B2B enterprise contract details + SSO config |

---

## Database Strategy

| Phase | Storage | Why |
|---|---|---|
| Phase 1 | **SQLite** (on-device) | 100% offline, zero latency, no auth |
| Phase 2–4 | **Supabase PostgreSQL** | Cloud sync, multi-device, social, B2B |
| Migration path | SQLite → Supabase | On first login, local SQLite data bulk-uploads to cloud; local remains as cache |
