# Master Schema Overview — Daily Activity Tracker (All Phases)

**33 tables · 4 phases · 2 databases (SQLite + PostgreSQL)**
Last updated: 2026-06-08

---

## Table of Contents

- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Phase 1 — SQLite (8 tables)](#phase-1--sqlite-8-tables)
- [Phase 2 — PostgreSQL (11 tables)](#phase-2--postgresql-11-tables)
- [Phase 3 — PostgreSQL (8 tables)](#phase-3--postgresql-8-tables)
- [Phase 4 — PostgreSQL (6 tables)](#phase-4--postgresql-6-tables)
- [Complete Index List](#complete-index-list)
- [Cross-Phase Relationships](#cross-phase-relationships)
- [Data Type Conventions](#data-type-conventions)

---

## Entity Relationship Diagram

```
═══════════════════════════════════════════════════════════════════════
PHASE 1 — SQLite (offline-first)
═══════════════════════════════════════════════════════════════════════

  app_settings
      │ (1 row per device)
      │
  activities ──────────────────────────────────────────────┐
      │                                                     │
      ├──── activity_logs (1:many)                          │
      │         (UNIQUE activity_id + log_date)             │
      │                                                     │
      ├──── streaks (1:1)                                   │
      │         (current + longest + forgiveness_used)      │
      │                                                     │
      ├──── exam_prep (1:1)  ──── exam_logs (1:many)        │
      │                      └─── mock_tests (1:many)       │
      │                                                     │
      └──── badges (1:many, nullable → global badges) ──────┘


═══════════════════════════════════════════════════════════════════════
PHASE 2 — PostgreSQL (Supabase, cloud sync)
═══════════════════════════════════════════════════════════════════════

  users (Supabase Auth UUID)
      │
      ├──── user_profiles (1:1)
      │
      ├──── friends (many:many via user_id + friend_user_id)
      │
      ├──── leaderboards (1:many — weekly/monthly/all_time rows)
      │
      ├──── challenges (1:many)
      │
      ├──── shares (1:many)
      │
      ├──── subscriptions (1:1)
      │
      ├──── analytics_daily (1:many — one row per user per date)
      │
      └──── team_members (many:many) ──── team_workspaces
                                               │
                                               └──── team_challenges (1:many)


═══════════════════════════════════════════════════════════════════════
PHASE 3 — PostgreSQL (AI + Wellness + Spiritual)
═══════════════════════════════════════════════════════════════════════

  users (Phase 2)
      │
      ├──── mood_logs (1:many — UNIQUE user_id + date)
      │
      ├──── fasts (1:many)
      │
      ├──── mantra_logs (1:many) ──── activities (Phase 1 FK)
      │
      ├──── ai_insights (1:many — weekly_review rows)
      │
      ├──── ai_coach_messages (1:many)
      │
      ├──── scheduled_plans (1:many)
      │
      └──── dosha_profiles (1:1)

  wellness_tips (standalone lookup table — no user FK)


═══════════════════════════════════════════════════════════════════════
PHASE 4 — PostgreSQL (Ecosystem — API + Integrations + Marketplace)
═══════════════════════════════════════════════════════════════════════

  users (Phase 2)
      │
      ├──── api_keys (1:many) ──── api_logs (1:many)
      │
      ├──── integrations (1:many — one row per integration type)
      │
      ├──── marketplace_programs (1:many as creator)
      │         │
      │         └──── program_enrollments (many:many users ↔ programs)
      │
  team_workspaces (Phase 2)
      │
      └──── enterprise_contracts (1:1)
```

---

## Phase 1 — SQLite (8 tables)

> Database: **Expo SQLite** on-device. No internet required. All IDs are `INTEGER` (autoincrement).
> Dates stored as `TEXT` in `YYYY-MM-DD` format (IST). Timestamps stored as `TEXT` ISO-8601.

---

### 1. `activities`

Core entity. Every tracked habit, subject, or spiritual practice is an activity.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | Local surrogate key |
| `user_id` | TEXT | NULLABLE | NULL | Reserved for Phase 2 cloud sync UUID |
| `name` | TEXT | NOT NULL | — | Display name e.g. "Gym", "Constitutional Law" |
| `category` | TEXT | NOT NULL | — | `Fitness` · `Study` · `Spiritual` · `Wellness` · `Work` · `Custom` |
| `icon` | TEXT | NOT NULL | `⚡` | Emoji or icon identifier |
| `frequency` | TEXT | NOT NULL | `daily` | `daily` · `weekly:1,3,5` (0=Sun…6=Sat) · `monthly:1,15` |
| `target_duration` | INTEGER | NULLABLE | NULL | Target minutes per session |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | ISO-8601 creation timestamp |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | ISO-8601 last update timestamp |
| `is_archived` | INTEGER | NOT NULL | `0` | Soft-delete flag (0=active, 1=archived) |

**Indexes:** `idx_activities_archived(is_archived)`

---

### 2. `activity_logs`

One row per activity per calendar day. The check-off record.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `activity_id` | INTEGER | NOT NULL · FK→activities.id · ON DELETE CASCADE | — | Parent activity |
| `log_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` in IST timezone |
| `duration_minutes` | INTEGER | NULLABLE | NULL | Actual duration logged |
| `quantity` | REAL | NULLABLE | NULL | For quantity tracking (e.g. 8 glasses water) |
| `status` | TEXT | NOT NULL | `completed` | `completed` · `skipped` · `missed` |
| `notes` | TEXT | NULLABLE | NULL | Optional user note |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | — |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | — |

**Constraints:** `UNIQUE(activity_id, log_date)` — prevents duplicate logs per day.
**Indexes:** `idx_activity_logs_date(log_date)` · `idx_activity_logs_activity(activity_id)`

---

### 3. `streaks`

One row per activity. Maintains live streak state including 48h forgiveness window.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `activity_id` | INTEGER | NOT NULL · UNIQUE · FK→activities.id · ON DELETE CASCADE | — | One streak record per activity |
| `current_streak_days` | INTEGER | NOT NULL | `0` | Active streak length in days |
| `longest_streak_days` | INTEGER | NOT NULL | `0` | All-time best streak |
| `streak_start_date` | TEXT | NULLABLE | NULL | `YYYY-MM-DD` when current streak began |
| `last_logged_date` | TEXT | NULLABLE | NULL | `YYYY-MM-DD` of most recent log |
| `forgiveness_used` | INTEGER | NOT NULL | `0` | `0`=grace not used · `1`=grace used this cycle |

**Business rule:** forgiveness_used resets to `0` each time user logs after grace. Once `forgiveness_used=1` and user misses again, streak resets to `0`.

---

### 4. `exam_prep`

One row per exam-mode activity. Stores exam type, subjects JSON, and syllabus coverage.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `activity_id` | INTEGER | NOT NULL · UNIQUE · FK→activities.id · ON DELETE CASCADE | — | Parent activity (must be exam-type) |
| `exam_type` | TEXT | NOT NULL | — | `UPSC` · `JEE` · `NEET` · `SSC` · `Banking` |
| `subjects` | TEXT | NOT NULL | `[]` | JSON: `[{"name":"Polity","completion":45}]` |
| `exam_date` | TEXT | NULLABLE | NULL | Target exam date `YYYY-MM-DD` |
| `syllabus_coverage_pct` | INTEGER | NOT NULL | `0` | Overall syllabus % complete (0–100) |

---

### 5. `exam_logs`

Study session logs linked to exam prep entries.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `exam_id` | INTEGER | NOT NULL · FK→exam_prep.id · ON DELETE CASCADE | — | Parent exam prep |
| `subject` | TEXT | NOT NULL | — | Subject studied e.g. "Constitutional Law" |
| `study_hours` | REAL | NOT NULL | `0` | Hours studied (e.g. 2.5) |
| `difficulty` | TEXT | NOT NULL | `medium` | `easy` · `medium` · `hard` |
| `log_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | — |

**Indexes:** `idx_exam_logs_exam_date(exam_id, log_date)`

---

### 6. `mock_tests`

Mock test score records with trend support.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `exam_id` | INTEGER | NOT NULL · FK→exam_prep.id · ON DELETE CASCADE | — | Parent exam prep |
| `subject` | TEXT | NULLABLE | NULL | Subject tested (NULL = full syllabus test) |
| `score` | INTEGER | NOT NULL | — | Raw score achieved |
| `total_marks` | INTEGER | NOT NULL | — | Maximum possible marks |
| `test_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | — |

**Computed:** `score_pct = (score / total_marks) * 100` — calculated in app, not stored.
**Indexes:** `idx_mock_tests_exam(exam_id, test_date)`

---

### 7. `badges`

Gamification badges. Pre-seeded rows exist for all possible badges; `is_earned` flips when unlocked.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | — |
| `activity_id` | INTEGER | NULLABLE · FK→activities.id · ON DELETE SET NULL | NULL | NULL = global badge (e.g. "7-Day Streak across any activity") |
| `badge_key` | TEXT | NOT NULL · UNIQUE | — | Stable identifier: `streak_7` · `streak_30` · `studied_100_hours` · `first_checkoff` |
| `badge_name` | TEXT | NOT NULL | — | Display name e.g. "7-Day Streaker" |
| `badge_icon` | TEXT | NOT NULL | `🏅` | Emoji or icon ref |
| `unlocked_at` | TEXT | NULLABLE | NULL | ISO-8601 timestamp when earned; NULL = not yet earned |
| `is_earned` | INTEGER | NOT NULL | `0` | `0`=locked · `1`=unlocked |

**Badge keys (seeded):**

| badge_key | Condition |
|---|---|
| `first_checkoff` | First activity ever logged |
| `streak_3` | 3-day streak on any activity |
| `streak_7` | 7-day streak |
| `streak_14` | 14-day streak |
| `streak_30` | 30-day streak |
| `streak_100` | 100-day streak |
| `studied_10_hours` | 10 total study hours |
| `studied_50_hours` | 50 total study hours |
| `studied_100_hours` | 100 total study hours |
| `mock_test_first` | First mock test logged |
| `mock_test_ace` | Score ≥ 90% on any mock test |
| `syllabus_50` | 50% syllabus coverage |
| `syllabus_100` | 100% syllabus coverage |
| `activities_5` | 5 different activities created |

---

### 8. `app_settings`

Single-row local settings store. One row inserted on first app launch.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | — | Always `1` |
| `user_id` | TEXT | NULLABLE | NULL | Filled when user creates cloud account (Phase 2) |
| `language` | TEXT | NOT NULL | `en` | `en` · `hi` · `ta` · `te` · `bn` |
| `theme` | TEXT | NOT NULL | `light` | `light` · `dark` |
| `timezone` | TEXT | NOT NULL | `Asia/Kolkata` | IANA timezone string |
| `notification_enabled` | INTEGER | NOT NULL | `1` | `1`=enabled · `0`=disabled |
| `reminder_times` | TEXT | NOT NULL | `[]` | JSON: `[{"activity_id":1,"time":"08:00"}]` |
| `onboarding_complete` | INTEGER | NOT NULL | `0` | `0`=not done · `1`=completed |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | — |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | — |

---

## Phase 2 — PostgreSQL (11 tables)

> Database: **Supabase PostgreSQL**. All PKs are `UUID` (gen_random_uuid()). Timestamps are `TIMESTAMPTZ`.
> Row Level Security (RLS) enabled on all user tables — users can only access their own rows.

---

### 9. `users`

Created automatically by Supabase Auth on sign-up. Extended with app-specific fields.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Matches Supabase Auth `auth.users.id` |
| `email` | TEXT | UNIQUE · NOT NULL | — | User's email address |
| `display_name` | TEXT | NULLABLE | NULL | Public display name |
| `profile_picture_url` | TEXT | NULLABLE | NULL | Avatar URL (Supabase Storage) |
| `phone` | TEXT | NULLABLE | NULL | Phone number (for UPI, optional) |
| `auth_provider` | TEXT | NOT NULL | `email` | `email` · `google` · `apple` |
| `is_local_only` | BOOLEAN | NOT NULL | `TRUE` | `TRUE`=Phase 1 local mode · `FALSE`=cloud sync enabled |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 10. `user_profiles`

Extended social profile. Created alongside the `users` row.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | UNIQUE · NOT NULL · FK→users.id · ON DELETE CASCADE | — | One profile per user |
| `language` | TEXT | NOT NULL | `en` | `en` · `hi` · `ta` · `te` · `bn` |
| `theme` | TEXT | NOT NULL | `light` | `light` · `dark` |
| `timezone` | TEXT | NOT NULL | `Asia/Kolkata` | IANA timezone |
| `notification_enabled` | BOOLEAN | NOT NULL | `TRUE` | — |
| `bio` | TEXT | NULLABLE | NULL | Short user bio (max 160 chars) |
| `profile_visibility` | TEXT | NOT NULL | `friends` | `private` · `friends` · `public` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 11. `friends`

Bidirectional friendship with status state machine: `pending → accepted` or `blocked`.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | Initiator (who sent the request) |
| `friend_user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | Recipient |
| `status` | TEXT | NOT NULL | `pending` | `pending` · `accepted` · `blocked` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Request sent timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | Status change timestamp |

**Constraints:** `UNIQUE(user_id, friend_user_id)` — no duplicate pairs.
**Note:** A friend relationship is one row only (initiator's direction). App queries both `user_id = me` and `friend_user_id = me` to build full friends list.

---

### 12. `leaderboards`

Pre-computed XP snapshot rows. Refreshed by a scheduled job (weekly/monthly reset).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `leaderboard_type` | TEXT | NOT NULL | — | `weekly` · `monthly` · `all_time` |
| `xp_total` | INTEGER | NOT NULL | `0` | XP accumulated in this period |
| `rank` | INTEGER | NULLABLE | NULL | Computed rank position (1 = top) |
| `week_start` | TEXT | NULLABLE | NULL | `YYYY-MM-DD` Monday — used for `weekly` type |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Indexes:** `idx_leaderboards_type_week(leaderboard_type, week_start)` · `idx_leaderboards_user(user_id)`

---

### 13. `challenges`

Tracks individual, friend, and team challenges and their completion state.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | Challenge participant |
| `challenge_type` | TEXT | NOT NULL | — | `weekly_auto` · `friend` · `team` |
| `activity_id` | UUID | NULLABLE | NULL | Linked activity (NULL = generic challenge) |
| `target_count` | INTEGER | NOT NULL | — | Goal quantity (e.g. 7 for 7-day challenge) |
| `target_metric` | TEXT | NOT NULL | — | `days` · `hours` · `activities` |
| `current_count` | INTEGER | NOT NULL | `0` | Progress toward target |
| `status` | TEXT | NOT NULL | `active` | `active` · `completed` · `failed` |
| `xp_reward` | INTEGER | NOT NULL | `0` | XP awarded on completion |
| `start_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `end_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 14. `shares`

Records every share event for analytics (WhatsApp share rate tracking).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `content_type` | TEXT | NOT NULL | — | `streak_card` · `weekly_summary` · `achievement` |
| `content_data` | JSONB | NOT NULL | `{}` | Payload: `{"streak_days":14,"activity":"Gym"}` |
| `share_platform` | TEXT | NULLABLE | NULL | `whatsapp` · `instagram` · `twitter` |
| `share_count` | INTEGER | NOT NULL | `0` | Number of times this card was shared |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 15. `subscriptions`

One row per user. Tracks active subscription tier and Razorpay billing state.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | UNIQUE · NOT NULL · FK→users.id · ON DELETE CASCADE | — | One subscription record per user |
| `subscription_type` | TEXT | NOT NULL | `free` | `free` · `pro_monthly` · `pro_yearly` · `lifetime` · `premium_plus_monthly` · `premium_plus_yearly` · `family` · `college` · `b2b` |
| `razorpay_subscription_id` | TEXT | NULLABLE | NULL | Razorpay recurring sub ID (for UPI Autopay) |
| `razorpay_payment_id` | TEXT | NULLABLE | NULL | Last successful payment ID |
| `status` | TEXT | NOT NULL | `active` | `active` · `cancelled` · `expired` · `trial` |
| `amount_paid` | NUMERIC(10,2) | NULLABLE | NULL | Amount in INR |
| `billing_cycle` | TEXT | NULLABLE | NULL | `monthly` · `yearly` · `one_time` |
| `trial_ends_at` | TIMESTAMPTZ | NULLABLE | NULL | 14-day trial expiry |
| `starts_at` | TIMESTAMPTZ | NOT NULL | `now()` | Subscription start |
| `renewal_at` | TIMESTAMPTZ | NULLABLE | NULL | Next billing date |
| `cancelled_at` | TIMESTAMPTZ | NULLABLE | NULL | Cancellation timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 16. `team_workspaces`

Container for B2B corporate teams. Created by HR admins.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `team_name` | TEXT | NOT NULL | — | Display name |
| `admin_user_id` | UUID | NOT NULL · FK→users.id | — | Team owner / HR admin |
| `member_count` | INTEGER | NOT NULL | `1` | Cached member count (kept in sync) |
| `max_members` | INTEGER | NOT NULL | `500` | Hard cap |
| `status` | TEXT | NOT NULL | `active` | `active` · `paused` · `archived` |
| `company_name` | TEXT | NULLABLE | NULL | Company display name |
| `industry` | TEXT | NULLABLE | NULL | Industry category |
| `invite_code` | TEXT | UNIQUE · NOT NULL | — | Short alphanumeric join code |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 17. `team_members`

Join table — maps users to team workspaces with role.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `team_id` | UUID | NOT NULL · FK→team_workspaces.id · ON DELETE CASCADE | — | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `role` | TEXT | NOT NULL | `member` | `admin` · `manager` · `member` |
| `joined_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(team_id, user_id)` — no duplicate memberships.

---

### 18. `team_challenges`

Company-wide challenges created by HR admins.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `team_id` | UUID | NOT NULL · FK→team_workspaces.id · ON DELETE CASCADE | — | — |
| `challenge_name` | TEXT | NOT NULL | — | e.g. "Walk 10,000 Steps" |
| `description` | TEXT | NULLABLE | NULL | Extended description |
| `target_count` | INTEGER | NOT NULL | — | Goal quantity |
| `target_metric` | TEXT | NOT NULL | — | `steps` · `days` · `hours` · `activities` |
| `start_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `end_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `status` | TEXT | NOT NULL | `active` | `active` · `completed` · `cancelled` |
| `created_by` | UUID | NOT NULL · FK→users.id | — | Admin who created the challenge |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 19. `analytics_daily`

Pre-aggregated daily stats. One row per user per date. Updated by a background job after each log event.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `activities_logged` | INTEGER | NOT NULL | `0` | Total activities touched (any status) |
| `activities_completed` | INTEGER | NOT NULL | `0` | Status = completed |
| `activities_skipped` | INTEGER | NOT NULL | `0` | Status = skipped |
| `activities_missed` | INTEGER | NOT NULL | `0` | Status = missed |
| `total_duration_minutes` | INTEGER | NOT NULL | `0` | Sum of all duration_minutes |
| `xp_earned` | INTEGER | NOT NULL | `0` | XP accumulated on this date |
| `mood_rating` | INTEGER | NULLABLE | NULL | 1–5 (populated by Phase 3) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(user_id, date)` — one row per user per day.
**Indexes:** `idx_analytics_daily_user_date(user_id, date DESC)`

---

## Phase 3 — PostgreSQL (8 tables)

> Adds AI coaching, mood tracking, spiritual features (vrat/mantra), Ayurveda, and Premium+ tier support.

---

### 20. `mood_logs`

Daily mood/energy/sleep check-in. One row per user per date.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `mood_rating` | SMALLINT | NOT NULL · CHECK(1–5) | — | 1=Very bad · 3=Neutral · 5=Very good |
| `energy_level` | SMALLINT | NOT NULL · CHECK(1–5) | — | 1=Exhausted · 5=Energized |
| `sleep_quality` | SMALLINT | NULLABLE · CHECK(1–5) | NULL | 1=Terrible · 5=Excellent |
| `notes` | TEXT | NULLABLE | NULL | Optional 1–2 sentence journal entry |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(user_id, date)` — one check-in per day.

---

### 21. `fasts`

Vrat and fasting session records (Ekadashi, Navratri, Karwa Chauth, Ramadan, etc.).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `vrat_name` | TEXT | NOT NULL | — | `Ekadashi` · `Karwa Chauth` · `Navratri` · `Ramadan` · `Maha Shivaratri` · `Custom` |
| `start_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `end_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` (same as start for single-day fasts) |
| `start_time` | TEXT | NULLABLE | NULL | `HH:MM` fast begins (sunrise varies by location) |
| `end_time` | TEXT | NULLABLE | NULL | `HH:MM` fast breaks |
| `status` | TEXT | NOT NULL | `planned` | `planned` · `in_progress` · `completed` · `broken` |
| `mood_rating` | SMALLINT | NULLABLE · CHECK(1–5) | NULL | How user felt during fast |
| `notes` | TEXT | NULLABLE | NULL | Optional reflection |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 22. `mantra_logs`

Individual mantra/pooja counting sessions (digital mala).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `activity_id` | UUID | NULLABLE · FK→activities.id | NULL | Linked pooja activity (nullable) |
| `mantra_name` | TEXT | NOT NULL | — | `Om` · `Gayatri` · `Hanuman Chalisa` · `Surya Namaskar` · `Custom` |
| `count` | INTEGER | NOT NULL · CHECK > 0 | — | Number of repetitions (e.g. 108, 1000) |
| `duration_minutes` | INTEGER | NULLABLE | NULL | Time taken |
| `date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 23. `ai_insights`

Claude API-generated weekly review insights. One row per week per user.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `insight_week_start` | TEXT | NOT NULL | — | `YYYY-MM-DD` (always a Monday) |
| `insight_type` | TEXT | NOT NULL | `weekly_review` | `weekly_review` · `pattern` · `recommendation` |
| `insight_title` | TEXT | NOT NULL | — | Short headline e.g. "Consistency Hero 🔥" |
| `insight_text` | TEXT | NOT NULL | — | Full Claude-generated insight paragraph |
| `insight_data` | JSONB | NOT NULL | `{}` | Structured data for graphics: `{"streaks":[...],"patterns":[...]}` |
| `xp_reward` | INTEGER | NOT NULL | `0` | XP granted for acting on recommendation |
| `was_acted_upon` | BOOLEAN | NOT NULL | `FALSE` | Did user follow the recommendation? |
| `viewed_at` | TIMESTAMPTZ | NULLABLE | NULL | When user opened the insight |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(user_id, insight_week_start)` — one review per week per user.

---

### 24. `ai_coach_messages`

AI-generated re-engagement nudges. Sent when user goes inactive 2+ days.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `message_type` | TEXT | NOT NULL | — | `miss_streak` · `plan_recalibration` · `encouragement` · `exam_nudge` |
| `message_text` | TEXT | NOT NULL | — | Claude-generated message content |
| `triggered_reason` | TEXT | NOT NULL | — | `missed_2_days` · `low_completion_rate` · `exam_date_approaching` |
| `sent_at` | TIMESTAMPTZ | NULLABLE | NULL | When push notification was delivered |
| `was_opened` | BOOLEAN | NOT NULL | `FALSE` | Did user tap the notification? |
| `user_acted` | BOOLEAN | NOT NULL | `FALSE` | Did user log an activity after opening? |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 25. `scheduled_plans`

AI-generated or user-custom daily schedules.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `plan_name` | TEXT | NOT NULL | — | e.g. "UPSC Study Schedule", "Morning Fitness Routine" |
| `plan_json` | JSONB | NOT NULL | — | `[{"time":"06:00","activity":"Pooja","duration_min":30},...]` |
| `plan_type` | TEXT | NOT NULL | — | `ai_generated` · `user_custom` |
| `status` | TEXT | NOT NULL | `active` | `active` · `archived` |
| `adherence_rate` | NUMERIC(5,2) | NULLABLE | NULL | % of plan activities completed (0.00–1.00) |
| `start_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` plan became active |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 26. `wellness_tips`

Curated Ayurveda and seasonal wellness content. Seeded, no user FK.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `tip_text` | TEXT | NOT NULL | — | Tip content in target language |
| `tip_category` | TEXT | NOT NULL | — | `ayurveda` · `seasonal` · `general_wellness` · `spiritual` |
| `season` | TEXT | NULLABLE | NULL | `summer` · `monsoon` · `winter` · `spring` · NULL (year-round) |
| `dosha` | TEXT | NULLABLE | NULL | `vata` · `pitta` · `kapha` · NULL (all doshas) |
| `language` | TEXT | NOT NULL | `en` | `en` · `hi` · `ta` · `te` · `bn` |
| `display_order` | INTEGER | NOT NULL | `0` | Ordering within category |
| `is_active` | BOOLEAN | NOT NULL | `TRUE` | Soft-disable without deleting |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 27. `dosha_profiles`

User's Ayurvedic constitution determined via quiz or admin assignment.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | UNIQUE · NOT NULL · FK→users.id · ON DELETE CASCADE | — | One profile per user |
| `primary_dosha` | TEXT | NOT NULL | — | `vata` · `pitta` · `kapha` |
| `secondary_dosha` | TEXT | NULLABLE | NULL | Secondary dosha if dual-type |
| `dosha_determined_via` | TEXT | NOT NULL | `quiz` | `quiz` · `admin` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

## Phase 4 — PostgreSQL (6 tables)

> Adds public API infrastructure, third-party integrations, marketplace, and enterprise contracts.

---

### 28. `api_keys`

Developer API key management. Keys are hashed before storage — plain text never persisted.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | Key owner |
| `key_hash` | TEXT | UNIQUE · NOT NULL | — | SHA-256 hash of the API key |
| `key_prefix` | TEXT | NOT NULL | — | First 8 chars shown in UI (e.g. `dat_live_`) |
| `key_name` | TEXT | NOT NULL | — | Friendly label e.g. "My Zapier Integration" |
| `tier` | TEXT | NOT NULL | `free` | `free` · `pro` · `enterprise` |
| `requests_this_month` | INTEGER | NOT NULL | `0` | Rolling monthly usage counter |
| `rate_limit` | INTEGER | NOT NULL | `1000` | Max requests per month |
| `status` | TEXT | NOT NULL | `active` | `active` · `revoked` · `expired` |
| `last_used_at` | TIMESTAMPTZ | NULLABLE | NULL | Most recent API call timestamp |
| `expires_at` | TIMESTAMPTZ | NULLABLE | NULL | NULL = no expiry |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 29. `api_logs`

Request-level audit log for API usage. High-volume — partition by month in production.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `api_key_id` | UUID | NOT NULL · FK→api_keys.id · ON DELETE CASCADE | — | Which key made the call |
| `endpoint` | TEXT | NOT NULL | — | e.g. `GET /api/v1/activities` |
| `method` | TEXT | NOT NULL | — | `GET` · `POST` · `PATCH` · `DELETE` |
| `status_code` | SMALLINT | NOT NULL | — | HTTP response code |
| `response_time_ms` | INTEGER | NOT NULL | — | Latency in milliseconds |
| `ip_address` | INET | NULLABLE | NULL | Caller IP (for abuse detection) |
| `timestamp` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Indexes:** `idx_api_logs_key_ts(api_key_id, timestamp DESC)` · `idx_api_logs_ts(timestamp DESC)`

---

### 30. `integrations`

One row per user per integration type. Stores OAuth tokens (encrypted at rest).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `integration_type` | TEXT | NOT NULL | — | `zapier` · `google_calendar` · `slack` · `notion` · `ifttt` |
| `status` | TEXT | NOT NULL | `disconnected` | `connected` · `disconnected` · `error` |
| `external_account_id` | TEXT | NULLABLE | NULL | e.g. Slack workspace ID, Google Calendar ID |
| `auth_token` | TEXT | NULLABLE | NULL | OAuth access token (AES-256 encrypted) |
| `refresh_token` | TEXT | NULLABLE | NULL | OAuth refresh token (AES-256 encrypted) |
| `token_expires_at` | TIMESTAMPTZ | NULLABLE | NULL | Token expiry for refresh logic |
| `config` | JSONB | NOT NULL | `{}` | Integration-specific settings |
| `last_sync_at` | TIMESTAMPTZ | NULLABLE | NULL | Last successful sync |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(user_id, integration_type)` — one connection per integration per user.

---

### 31. `marketplace_programs`

Creator-published habit programs available for purchase.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `creator_user_id` | UUID | NOT NULL · FK→users.id | — | Program author |
| `program_name` | TEXT | NOT NULL | — | Display title |
| `program_description` | TEXT | NOT NULL | — | Full description |
| `category` | TEXT | NOT NULL | — | `fitness` · `study` · `wellness` · `spiritual` · `productivity` |
| `activities` | JSONB | NOT NULL | `[]` | `[{"name":"Gym","duration":60,"frequency":"daily"},...]` |
| `duration_days` | INTEGER | NOT NULL | — | Program length (e.g. 30 for 30-day challenge) |
| `price` | NUMERIC(10,2) | NOT NULL | `0` | INR price (0 = free) |
| `icon_url` | TEXT | NULLABLE | NULL | Program icon |
| `cover_image_url` | TEXT | NULLABLE | NULL | Banner image |
| `rating` | NUMERIC(3,2) | NOT NULL | `0` | Average user rating (0.00–5.00) |
| `review_count` | INTEGER | NOT NULL | `0` | Total reviews |
| `sales_count` | INTEGER | NOT NULL | `0` | Total enrollments |
| `status` | TEXT | NOT NULL | `draft` | `draft` · `published` · `archived` |
| `revenue_share_pct` | SMALLINT | NOT NULL | `70` | % paid to creator (platform takes 30%) |
| `featured` | BOOLEAN | NOT NULL | `FALSE` | Featured placement in marketplace |
| `featured_until` | TIMESTAMPTZ | NULLABLE | NULL | Featured expiry |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

### 32. `program_enrollments`

Tracks user enrollment and progress in marketplace programs.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `user_id` | UUID | NOT NULL · FK→users.id · ON DELETE CASCADE | — | — |
| `program_id` | UUID | NOT NULL · FK→marketplace_programs.id | — | — |
| `status` | TEXT | NOT NULL | `active` | `active` · `completed` · `abandoned` |
| `progress_pct` | SMALLINT | NOT NULL | `0` | 0–100 % of program activities completed |
| `enrolled_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `completed_at` | TIMESTAMPTZ | NULLABLE | NULL | Completion timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

**Constraints:** `UNIQUE(user_id, program_id)` — one enrollment per user per program.

---

### 33. `enterprise_contracts`

B2B contract terms, pricing, and SSO configuration for large enterprise teams.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | — |
| `team_id` | UUID | UNIQUE · NOT NULL · FK→team_workspaces.id · ON DELETE CASCADE | — | One contract per team |
| `contract_start_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `contract_end_date` | TEXT | NOT NULL | — | `YYYY-MM-DD` |
| `seats_count` | INTEGER | NOT NULL | — | Contracted seat quantity |
| `price_per_seat` | NUMERIC(10,2) | NOT NULL | — | INR per seat per month |
| `discount_pct` | SMALLINT | NOT NULL | `0` | Volume discount % (0–30) |
| `total_contract_value` | NUMERIC(12,2) | NOT NULL | — | Total INR value (computed) |
| `billing_contact` | TEXT | NOT NULL | — | Email for invoices |
| `technical_contact` | TEXT | NOT NULL | — | Email for SSO/IT setup |
| `sso_provider` | TEXT | NULLABLE | NULL | `google_workspace` · `microsoft_365` · `okta` |
| `saml_metadata_url` | TEXT | NULLABLE | NULL | SAML IdP metadata URL for SSO |
| `status` | TEXT | NOT NULL | `active` | `active` · `renewal_pending` · `expired` · `terminated` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | — |

---

## Complete Index List

### Phase 1 — SQLite

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_activities_archived` | activities | `is_archived` | Filter active vs archived |
| `idx_activity_logs_date` | activity_logs | `log_date` | Home screen date queries |
| `idx_activity_logs_activity` | activity_logs | `activity_id` | Activity history |
| `idx_exam_logs_exam_date` | exam_logs | `(exam_id, log_date)` | Subject timeline |
| `idx_mock_tests_exam` | mock_tests | `(exam_id, test_date)` | Score trends |

### Phase 2 — PostgreSQL

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_leaderboards_type_week` | leaderboards | `(leaderboard_type, week_start)` | Weekly leaderboard fetch |
| `idx_leaderboards_user` | leaderboards | `user_id` | User rank lookup |
| `idx_analytics_daily_user_date` | analytics_daily | `(user_id, date DESC)` | Analytics date range queries |
| `idx_team_members_team` | team_members | `team_id` | Team roster fetch |
| `idx_team_members_user` | team_members | `user_id` | User's teams |
| `idx_challenges_user_status` | challenges | `(user_id, status)` | Active challenges list |
| `idx_subscriptions_status` | subscriptions | `status` | Renewal/expiry jobs |

### Phase 3 — PostgreSQL

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_mood_logs_user_date` | mood_logs | `(user_id, date DESC)` | Mood history + correlation |
| `idx_fasts_user_date` | fasts | `(user_id, start_date DESC)` | Vrat history |
| `idx_ai_insights_user_week` | ai_insights | `(user_id, insight_week_start DESC)` | Weekly review lookup |
| `idx_ai_coach_user_sent` | ai_coach_messages | `(user_id, sent_at DESC)` | Recent nudges |
| `idx_mantra_user_date` | mantra_logs | `(user_id, date DESC)` | Mantra history |

### Phase 4 — PostgreSQL

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_api_logs_key_ts` | api_logs | `(api_key_id, timestamp DESC)` | Per-key usage stats |
| `idx_api_logs_ts` | api_logs | `timestamp DESC` | Global API monitoring |
| `idx_integrations_user_type` | integrations | `(user_id, integration_type)` | Integration status check |
| `idx_marketplace_status_cat` | marketplace_programs | `(status, category)` | Marketplace browse |
| `idx_enrollments_user` | program_enrollments | `user_id` | User's enrolled programs |

---

## Cross-Phase Relationships

```
Phase 1 SQLite                    Phase 2+ PostgreSQL
──────────────                    ───────────────────
activities.user_id ────────────→  users.id
activity_logs (synced) ────────→  analytics_daily (aggregated)
streaks (synced) ───────────────→ leaderboards (XP computed from streaks)
badges (synced) ────────────────→ (mirrored in Postgres for social display)

Phase 2 PostgreSQL                Phase 3 PostgreSQL
──────────────────                ──────────────────
users.id ──────────────────────→  mood_logs.user_id
users.id ──────────────────────→  fasts.user_id
users.id ──────────────────────→  ai_insights.user_id
analytics_daily.mood_rating ───→  mood_logs (backfilled daily)

Phase 2 PostgreSQL                Phase 4 PostgreSQL
──────────────────                ──────────────────
users.id ──────────────────────→  api_keys.user_id
users.id ──────────────────────→  integrations.user_id
users.id ──────────────────────→  program_enrollments.user_id
team_workspaces.id ────────────→  enterprise_contracts.team_id
```

---

## Data Type Conventions

| Convention | Phase 1 SQLite | Phase 2–4 PostgreSQL |
|---|---|---|
| Primary Key | `INTEGER AUTOINCREMENT` | `UUID DEFAULT gen_random_uuid()` |
| Dates | `TEXT 'YYYY-MM-DD'` | `TEXT 'YYYY-MM-DD'` (stored as text for portability) |
| Timestamps | `TEXT ISO-8601` | `TIMESTAMPTZ DEFAULT now()` |
| Boolean | `INTEGER (0/1)` | `BOOLEAN` |
| JSON | `TEXT (JSON string)` | `JSONB` |
| Money | `REAL` | `NUMERIC(10,2)` |
| Soft-delete | `is_archived = 1` | `status = 'archived'` |
| Cascade deletes | `ON DELETE CASCADE` on all child FKs | `ON DELETE CASCADE` on all child FKs |
| Timezone | `Asia/Kolkata` default | `Asia/Kolkata` default in `app_settings` |
