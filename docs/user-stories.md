# Sprint 1 — User Stories

## US-001: Language Selection on First Launch

**Epic:** Onboarding
**Persona:** Raj (UPSC Aspirant, Lucknow)
**Story:** As Raj, I want to select Hindi as my app language on first launch, so that I can use the app comfortably in my native language.

### Acceptance Criteria

```gherkin
Feature: Language Selection

  Scenario: User selects Hindi on first launch
    Given the app is launched for the first time
    When the language selection screen appears
    Then I see options: हिन्दी, English, தமிழ், తెలుగు, বাংলা
    And each option displays the language name in its own script
    When I tap "हिन्दी"
    Then the app language changes to Hindi immediately
    And I am navigated to the onboarding quiz screen
    And all subsequent text appears in Hindi

  Scenario: Language preference persists across restarts
    Given I previously selected Hindi
    When I close and reopen the app
    Then the app launches directly in Hindi
    And the language selection screen is NOT shown again

  Scenario: User can change language later in Settings
    Given I am on the Settings screen
    When I tap "Language"
    Then I see all 5 language options
    When I select "English"
    Then the UI immediately updates to English without restart

  Scenario: Fallback language
    Given the device language is not in our supported list (e.g., Marathi)
    When the app launches for the first time
    Then English is pre-selected as the default language
    And the language selection screen is still shown to let the user choose
```

### Edge Cases
- RTL layout: Hindi/Bengali are LTR; all supported languages are LTR — no RTL switching needed in Phase 1
- Text overflow: All language option labels must fit within their card at all font sizes (small/default/large accessibility)
- Offline: Language selection works fully offline (locale files bundled in app)

### Data Model Impact
- `app_settings.language` updated on selection
- Stored via `settingsRepo.updateSettings({ language })`

---

## US-002: Onboarding Quiz — Goal Selection

**Epic:** Onboarding
**Persona:** Priya (Fitness Enthusiast, Delhi)
**Story:** As Priya, I want to complete a quick goal-setting quiz when I first open the app, so that the app is pre-configured with relevant starter activities for my fitness goals.

### Acceptance Criteria

```gherkin
Feature: Onboarding Quiz

  Scenario: Fitness user completes onboarding quiz
    Given I have selected my language
    When I reach the onboarding quiz
    Then I see Step 1: "What is your primary goal?"
    And I see 4 options: 🎓 Exam Prep, 💪 Fitness & Health, 🧘 Spiritual & Wellness, 📊 Personal Productivity
    When I select "Fitness & Health"
    Then I proceed to Step 2: "How many activities do you want to track daily?"
    And options are: 1–2, 3–5, 6–10
    When I select "3–5" and tap "Get Started"
    Then starter activities are created: Workout, Morning Walk, Water Intake
    And I land on the Home screen with today's activity list

  Scenario: Exam prep user triggers exam mode
    Given I am on the onboarding quiz
    When I select "Exam Prep"
    Then Step 2 shows: "Which exam are you preparing for?"
    And options are: UPSC, JEE, NEET, SSC, Banking Exams
    When I select "UPSC"
    Then a study tracker activity is created with exam_prep row linked to UPSC
    And I land on the Home screen with the UPSC study tracker visible

  Scenario: User skips onboarding
    Given I am on the onboarding quiz
    When I tap "Skip" (visible on all steps)
    Then I land on the Home screen with no starter activities
    And a "Add your first activity" empty state is shown

  Scenario: App remembers onboarding completion
    Given I have completed onboarding
    When I restart the app
    Then I go directly to the Home screen
    And the onboarding quiz is NOT shown again
```

### Edge Cases
- If user backs out mid-quiz, progress is preserved in local state (not saved to SQLite until completion)
- Starter templates are idempotent — running onboarding twice does not create duplicates
- Exam mode detection: if exam prep goal selected, `exam_prep` row is created alongside the activity

### Data Model Impact
- Creates rows in `activities` table (starter templates)
- Creates row in `exam_prep` if exam goal selected
- Sets `app_settings.onboarding_complete = true` on completion

---

## US-003: Activity Creation

**Epic:** Activity Management
**Persona:** Any user
**Story:** As any user, I want to create a custom activity with a name, icon, frequency, and category, so that I can track exactly the habits that matter to me.

### Acceptance Criteria

```gherkin
Feature: Activity Creation

  Scenario: User creates a daily activity
    Given I am on the Home screen
    When I tap the "+" button
    Then the activity creation modal slides up from the bottom
    And I see fields: Name, Icon (emoji picker), Category, Frequency, Target Duration (optional)
    When I type "Morning Yoga" in Name
    And I select 🧘 from the emoji picker
    And I select category "Spiritual & Wellness"
    And I set frequency to "Daily"
    And I tap "Save"
    Then the modal closes
    And "Morning Yoga" appears in today's activity list
    And the activity is persisted in SQLite

  Scenario: Name validation — empty
    Given I am on the activity creation modal
    When I tap "Save" without entering a name
    Then an error message appears: "Activity name is required"
    And the modal does not close

  Scenario: Name validation — too long
    Given I type more than 50 characters in the name field
    Then the field stops accepting input at 50 characters
    And a character counter "50/50" is shown in red

  Scenario: Weekly frequency — specific days
    Given I set frequency to "Weekly"
    Then I see a day picker: Mon Tue Wed Thu Fri Sat Sun
    When I select Mon, Wed, Fri
    Then the activity only appears on those days in the Home view

  Scenario: Activity with target duration
    Given I create an activity with target duration of 30 minutes
    When I check it off
    Then I can optionally log the actual duration
    And the streak counts the activity as completed regardless of duration logged

  Scenario: Duplicate activity name
    Given an activity named "Workout" already exists
    When I try to create another activity named "Workout"
    Then a warning is shown: "You already have an activity named 'Workout'. Create anyway?"
    And I can choose to proceed or go back to rename
```

### Validation Rules
| Field | Rule |
|---|---|
| Name | Required, 1–50 characters, any Unicode (emoji, Devanagari, Tamil supported) |
| Icon | Required, defaults to first emoji in picker if not selected |
| Category | Required, must be from predefined list |
| Frequency | Required: "daily", "weekly" + days array, or "custom" |
| Target Duration | Optional, 1–480 minutes (0 = no target) |

### Data Model Impact
- Inserts into `activities` table
- Inserts into `streaks` table with current_streak=0
- `settingsRepo` reminder times can be added post-creation

---

## US-004: One-Tap Activity Check-Off (< 100ms)

**Epic:** Activity Logging
**Persona:** Any user
**Story:** As any user, I want to check off an activity with a single tap and feel instant response, so that logging my habits takes no effort and has no friction.

### Acceptance Criteria

```gherkin
Feature: One-Tap Check-Off

  Scenario: User checks off an activity
    Given "Morning Yoga" is in today's activity list (unchecked)
    When I tap the check circle next to "Morning Yoga"
    Then the circle turns green and shows a checkmark immediately (< 100ms)
    And a haptic pulse fires
    And the activity visually moves to "completed" state
    And the SQLite log entry is written asynchronously in the background

  Scenario: Check-off persists after app restart
    Given I checked off "Morning Yoga" today
    When I close and reopen the app
    Then "Morning Yoga" shows as completed for today
    And the check-off is NOT lost

  Scenario: Undo check-off
    Given I just checked off "Morning Yoga"
    When I tap the green checkmark again within 5 seconds
    Then a snackbar appears: "Undo check-off?"
    When I tap "Undo"
    Then the activity returns to unchecked state
    And the SQLite log is deleted

  Scenario: Already-completed activity
    Given "Morning Yoga" is marked as completed today
    When I view the Home screen
    Then the activity shows with green checkmark and is visually dimmed
    And the streak count shows: "🔥 3 days"

  Scenario: Check-off while offline
    Given my phone has no internet connection
    When I tap the check circle
    Then the check-off is logged locally to SQLite immediately
    And no network error is shown
    And the behavior is identical to online check-off

  Scenario: Performance — check-off latency
    Given the app is running on a mid-range Android device (2GB RAM)
    When I tap the check circle
    Then the UI responds (circle turns green) within 100 milliseconds
    (Measured from touch event to visual state change — no spinner or loading state)
```

### Performance Implementation Notes
- The `optimisticCheckOff(activityId)` Zustand action is called synchronously on button press
- The SQLite write (`logsRepo.logActivity`) is called asynchronously after the UI update
- If the SQLite write fails, `revertCheckOff(activityId)` is called and a snackbar error is shown
- No network calls are made during check-off in Phase 1

### Data Model Impact
- Inserts into `activity_logs` (status="completed", log_date=today)
- Updates `streaks` table after successful DB write
- Badge engine runs after streak update

---

## US-005: Activity Data Persistence (Offline-First)

**Epic:** Offline & Data Integrity
**Persona:** Any user
**Story:** As any user, I want my activities and logs to be saved locally on my phone, so that the app works completely without internet and my data is never lost.

### Acceptance Criteria

```gherkin
Feature: Offline-First Persistence

  Scenario: Activities persist across app restarts
    Given I created 3 activities and logged them today
    When I force-close and reopen the app
    Then all 3 activities are visible with their correct checked/unchecked state
    And streaks are correct
    And no data is lost

  Scenario: App works with airplane mode on
    Given airplane mode is ON
    When I open the app
    Then all activities load correctly from SQLite
    When I create a new activity and check it off
    Then everything works identically to online mode
    And no error messages related to network appear

  Scenario: Database migration on app update
    Given the user has v1.0.0 installed with data
    When they update to v1.1.0 (which adds a new column)
    Then the migration runs automatically on next app open
    And existing data is preserved
    And the new column has correct default values

  Scenario: SQLite data integrity — foreign key enforcement
    Given an activity_log references an activity that was archived
    When I query today's logs
    Then the archived activity's logs are excluded from the active view
    And the data is not corrupted

  Scenario: Concurrent writes (rapid tapping)
    Given a user taps the check-off button 3 times in rapid succession
    Then only one log entry is created for today
    And the streak is incremented once, not 3 times
    (Idempotency: logActivity uses INSERT OR IGNORE on (activity_id, log_date))
```

### Data Model Impact
- All data stored in SQLite via Expo SQLite v2 API
- Migration version tracked via `PRAGMA user_version`
- All writes use transactions for consistency
- Idempotent upserts where applicable

---

*Sprint 2 stories (Streaks, Calendar, Notifications) will be added at Sprint 2 kickoff.*
