# PRD: Activity Creation & Logging Feature
## Daily Activity Tracker — Sprint 1

**Author:** Claude (PM role)  
**Stakeholder:** Vikas (Product Owner)  
**Status:** Approved for Sprint 1  
**Last Updated:** 2026-06-08

---

## Problem Statement

Indian users who want to build consistent daily habits currently have two bad options:
1. **Generic global apps** (Habitica, Streaks, Notion): English-only, not optimized for India-specific use cases (exam prep, spiritual practices, Tier 2/3 device constraints)
2. **Paper/Google Sheets**: No streak motivation, no reminders, no gamification, no sharing

The result: 78% of habit-building attempts fail within 2 weeks (source: behavioral science literature). The Daily Activity Tracker solves this by combining zero-friction logging (< 100ms check-off), Hindi-first UX, and India-specific activity templates.

---

## Target Users

| Persona | Primary Need | Activity Type |
|---|---|---|
| Raj (UPSC aspirant) | Study hour tracking by subject | Exam Prep activities |
| Priya (Fitness, Delhi) | Workout streak + Instagram sharing | Fitness activities |
| Amit (Spiritual, Mumbai) | Pooja/yoga consistency | Spiritual activities |
| Sarah (Corporate, TCS) | Team wellness visibility | Productivity activities |

**Phase 1 Focus:** Raj + Priya (80% of expected initial downloads)

---

## Feature Overview

**Activity Creation** allows users to define custom trackable habits. Each activity has:
- Name (user-defined, up to 50 chars)
- Icon (emoji from curated picker)
- Category (Fitness, Study, Spiritual, Health, Productivity, Custom)
- Frequency (Daily / Weekly with day picker / Custom)
- Optional target duration (for time-based activities like "Study 4 hours")

**Activity Logging** (Check-Off) allows users to mark an activity as done for today:
- One-tap interaction — zero forms, zero modals for basic logging
- Optional: log duration/quantity after check-off (for detailed tracking)
- Offline-first: works without internet

---

## Functional Requirements

### FR-1: Activity Creation Modal
- **FR-1.1** The modal is triggered by tapping the "+" FAB on the Home screen
- **FR-1.2** Modal slides up from bottom as a sheet (not full-screen takeover)
- **FR-1.3** Name field: max 50 chars, Unicode-compatible (Devanagari, Tamil, Telugu, Bengali)
- **FR-1.4** Emoji picker: grid of 60 curated emojis organized by category
- **FR-1.5** Category selector: 6 categories with icons (Fitness 💪, Study 📚, Spiritual 🕉️, Health 🏥, Productivity 📊, Custom ⚡)
- **FR-1.6** Frequency: Daily, Weekly (with day picker), Custom (specific days of month)
- **FR-1.7** Target duration: optional slider (0–480 minutes, default off)
- **FR-1.8** Save button: disabled until Name + Category + Frequency are filled
- **FR-1.9** On save: creates SQLite row, triggers Zustand store update, closes modal

### FR-2: One-Tap Check-Off
- **FR-2.1** Each activity in the list shows a circle button on the left
- **FR-2.2** On tap: circle fills with primary color + checkmark, haptic medium impact fires
- **FR-2.3** Visual response must occur in < 100ms from touch event (optimistic UI)
- **FR-2.4** SQLite write happens asynchronously after visual update
- **FR-2.5** If SQLite write fails: revert UI + show snackbar error
- **FR-2.6** Undo available for 5 seconds via snackbar "Undo"
- **FR-2.7** Re-tapping a completed activity within 5s offers undo; after 5s does nothing

### FR-3: Activity List (Home Screen)
- **FR-3.1** Shows only activities scheduled for today (based on frequency)
- **FR-3.2** Completed activities shown with green checkmark + dimmed appearance
- **FR-3.3** Incomplete activities shown prominently at top (sorted by priority)
- **FR-3.4** Progress bar at top: "X of Y completed today"
- **FR-3.5** Empty state: "Add your first activity +" with illustration
- **FR-3.6** Pull-to-refresh is NOT needed (data comes from local SQLite)

---

## Non-Functional Requirements

| Requirement | Target | Measurement |
|---|---|---|
| Check-off latency | < 100ms visual response | `performance.now()` in dev mode |
| List render time | < 200ms for 20 activities | FlatList with `getItemLayout` |
| App startup to home | < 2 seconds cold start | Expo startup profiler |
| SQLite write (single row) | < 50ms | Measured in integration tests |
| Memory usage | < 100 MB typical | Android Studio profiler |
| APK size contribution | < 2 MB for this feature | Bundle analyzer |

---

## Data Model

### `activities` table
```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_duration INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_archived INTEGER DEFAULT 0
);
```

### `activity_logs` table
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,
  duration_minutes INTEGER,
  quantity REAL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE(activity_id, log_date)
);
```

---

## API Design (SQLite Layer)

```typescript
// activitiesRepo.ts
createActivity(input: CreateActivityInput): Promise<Activity>
getActivities(filters?: { archived?: boolean }): Promise<Activity[]>
getActivitiesForDate(date: string): Promise<Activity[]>
updateActivity(id: number, updates: Partial<Activity>): Promise<void>
archiveActivity(id: number): Promise<void>
getActivityById(id: number): Promise<Activity | null>

// logsRepo.ts
logActivity(activityId: number, date: string, opts?: LogOptions): Promise<ActivityLog>
getLogsForDate(date: string): Promise<ActivityLog[]>
getLogsForRange(startDate: string, endDate: string): Promise<ActivityLog[]>
deleteLog(activityId: number, date: string): Promise<void>
```

---

## Analytics Events (PostHog — opt-in only)

| Event | Properties | Trigger |
|---|---|---|
| `activity_created` | category, frequency, has_duration, onboarding | On save |
| `activity_checked_off` | activity_id (hashed), category, streak_day | On check-off |
| `activity_undo` | — | On undo tap |
| `onboarding_completed` | goal, exam_type (if exam), language | On quiz complete |
| `onboarding_skipped` | step_number | On skip |

**Privacy:** No PII collected. All event properties are anonymized. Fires only if user has opted in (off by default per DPDP Act guidance).

---

## Localization Requirements

All UI strings for this feature must be available in:
- English (en) — base
- Hindi (hi) — required for launch
- Tamil (ta) — required for launch
- Telugu (te) — required for launch
- Bengali (bn) — nice-to-have for launch

**Key strings for this feature:**
```
activities.create.title
activities.create.name_placeholder
activities.create.name_error_empty
activities.create.name_error_too_long
activities.create.category_label
activities.create.frequency_label
activities.create.frequency_daily
activities.create.frequency_weekly
activities.create.save
activities.check_off.undo
activities.check_off.error
activities.list.empty_state
activities.list.progress
```

---

## Acceptance Criteria (Summary)

✅ Activity creation modal opens on "+" tap  
✅ All 6 form fields work correctly with validation  
✅ Activity saved to SQLite and persists across restart  
✅ Activity appears in today's list immediately after creation  
✅ Check-off visual response < 100ms  
✅ Check-off persists in SQLite  
✅ Undo available within 5 seconds  
✅ All UI text translated in Hindi, English, Tamil, Telugu  
✅ Feature works offline (airplane mode test)  
✅ No duplicate logs for same activity+date (UNIQUE constraint)  

---

## Out of Scope (Phase 1)

- ❌ Activity templates marketplace
- ❌ Social sharing of activities (Phase 2)
- ❌ Activity duplication / import
- ❌ Drag-to-reorder activities (Phase 2)
- ❌ Sub-tasks within activities (Phase 2)
- ❌ Quantity logging at check-off time (stretch, may include if time permits)

---

## Success Metrics (Post-Launch)

| Metric | Target | How Measured |
|---|---|---|
| Activities created per user (D7) | ≥ 3 | PostHog `activity_created` count |
| Daily check-off rate (D7) | ≥ 60% | PostHog `activity_checked_off` / DAU |
| Check-off latency (P95) | < 100ms | Sentry performance tracing |
| Activity creation completion rate | ≥ 85% | `activity_created` / modal open events |
