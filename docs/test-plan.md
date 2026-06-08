# Test Plan — Sprint 1: Onboarding + Activity Creation + Check-Off
## Daily Activity Tracker — India Edition

**Prepared by:** Claude (QA role)  
**Sprint:** 1 (Week 1–2)  
**Last Updated:** 2026-06-08

---

## 1. Test Scope

### In Scope
- Language selection screen (5 languages)
- Onboarding quiz (all paths: fitness, exam, spiritual, productivity, skip)
- Activity creation modal (all form fields, validation, save flow)
- Activity list view (today filter, empty state, completed state)
- One-tap check-off (performance, persistence, undo)
- SQLite persistence (data survives restart, UNIQUE constraint)
- Offline behavior (all features in airplane mode)
- Hindi + English localization (spot-check Tamil/Telugu)

### Out of Scope (Sprint 1)
- Streak calculation (Sprint 2)
- Push notifications (Sprint 2)
- Calendar heatmap (Sprint 2)
- Exam prep mode (Sprint 3)
- Badge system (Sprint 3)
- Cloud sync (Phase 2)

---

## 2. Test Environments

| Environment | Device | OS | Method |
|---|---|---|---|
| Primary Android | Pixel 7 emulator | Android 13 | Expo Go |
| Low-end Android | Redmi Note 5 emulator | Android 8 (API 27) | Expo Go |
| Primary iOS | iPhone 15 simulator | iOS 17 | Expo Go |
| Old iOS | iPhone 8 simulator | iOS 13 | Expo Go |
| Performance | Android mid-range (2GB RAM) | Android 10 | Expo Go |

---

## 3. Test Cases

### TC-001: Language Selection — Happy Path

**Type:** Functional  
**Priority:** P0  
**Precondition:** Fresh install, no previous data

| Step | Action | Expected Result |
|---|---|---|
| 1 | Launch app for first time | Language selection screen appears |
| 2 | Verify 5 language options | हिन्दी, English, தமிழ், తెలుగు, বাংলা all visible in native script |
| 3 | Tap "हिन्दी" | App language immediately changes to Hindi |
| 4 | Observe screen transition | Navigates to onboarding quiz in Hindi |
| 5 | Force-close and reopen | App opens directly in Hindi (no language screen) |

**Pass Criteria:** Language persists, no language selection on second launch.

---

### TC-002: Language Selection — English Default for Unsupported Locale

**Type:** Functional / Edge Case  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set device language to Marathi | — |
| 2 | Fresh install and launch | Language selection appears with English pre-highlighted |
| 3 | Verify all options still visible | All 5 options appear (Marathi is not in the list, that's expected) |

---

### TC-003: Language Option Text Overflow

**Type:** UI / Localization  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open language selection | All 5 option cards visible |
| 2 | Increase font size to "Largest" in device accessibility settings | All language names still fit within their cards, no truncation |
| 3 | Decrease font size to "Smallest" | All language names remain legible |

---

### TC-004: Onboarding — Fitness Goal Path

**Type:** Functional  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Select "English" language | — |
| 2 | Tap "Fitness & Health" | Step 2 appears: daily activity count |
| 3 | Select "3–5" activities | — |
| 4 | Tap "Get Started" | Home screen appears |
| 5 | Verify starter activities | "Workout", "Morning Walk", "Water Intake" in list |
| 6 | Restart app | Same 3 activities present (SQLite persistence) |

---

### TC-005: Onboarding — Exam Prep (UPSC) Path

**Type:** Functional  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Select Hindi language | — |
| 2 | Tap "Pariksha Taiyari" (Exam Prep) | Step 2 shows exam type selector |
| 3 | Tap "UPSC" | — |
| 4 | Tap "Shuru Karen" | Home screen in Hindi with UPSC activity |
| 5 | Verify exam_prep record | SQLite has exam_prep row with exam_type="UPSC" |

---

### TC-006: Onboarding — Skip All Steps

**Type:** Functional / Edge Case  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Reach onboarding quiz | — |
| 2 | Tap "Skip" | Skip confirmation or immediate skip to Home |
| 3 | Verify Home screen | Empty state shown: "Add your first activity" |
| 4 | Verify no starter activities | SQLite activities table is empty |

---

### TC-007: Onboarding Does Not Repeat

**Type:** Functional  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Complete onboarding fully | Home screen shown |
| 2 | Force-close app | — |
| 3 | Reopen app | Home screen appears DIRECTLY (not language selection or onboarding) |

---

### TC-008: Activity Creation — Happy Path

**Type:** Functional  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Tap "+" FAB on Home screen | Activity creation modal slides up |
| 2 | Enter name: "Morning Yoga" | Name field shows "Morning Yoga" |
| 3 | Select icon: 🧘 | Icon button highlights |
| 4 | Select category: "Spiritual & Wellness" | Category highlighted |
| 5 | Set frequency: Daily | Frequency shows "Daily" |
| 6 | Tap "Save" | Modal closes |
| 7 | Verify activity in list | "Morning Yoga 🧘" appears in today's list |
| 8 | Force-close and reopen | "Morning Yoga" still in list |

---

### TC-009: Activity Creation — Empty Name Validation

**Type:** Validation  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open activity creation modal | — |
| 2 | Leave name field empty | — |
| 3 | Select all other required fields | — |
| 4 | Tap "Save" | Error shown: "Activity name is required" |
| 5 | Modal stays open | User can continue editing |

---

### TC-010: Activity Creation — Name Too Long (50 char limit)

**Type:** Validation  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open activity creation modal | — |
| 2 | Type 51-character string | Input stops at 50 characters |
| 3 | Verify character counter | Shows "50/50" in red |

---

### TC-011: Activity Creation — Emoji Name (Unicode)

**Type:** Localization / Edge Case  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open activity creation modal | — |
| 2 | Type Hindi name: "सुबह की सैर" | Devanagari renders correctly in input |
| 3 | Save activity | Activity appears with Hindi name in list |
| 4 | Restart app | Hindi name renders correctly after restart |

---

### TC-012: Activity Creation — Weekly Frequency with Day Picker

**Type:** Functional  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open activity creation modal | — |
| 2 | Select frequency: "Weekly" | Day picker (Mon–Sun) appears |
| 3 | Select Mon, Wed, Fri | Three days highlighted |
| 4 | Save activity | — |
| 5 | Check today (assume Tuesday) | Activity NOT in today's list |
| 6 | Check Monday | Activity IS in Monday's list |

---

### TC-013: One-Tap Check-Off — Happy Path

**Type:** Functional + Performance  
**Priority:** P0 (CRITICAL)

| Step | Action | Expected Result |
|---|---|---|
| 1 | Ensure at least 1 activity in today's list | — |
| 2 | Tap check circle on activity | Circle turns green + checkmark IMMEDIATELY |
| 3 | Measure latency | Visual response < 100ms from tap to fill |
| 4 | Verify haptic | Haptic pulse fires on tap |
| 5 | Restart app | Activity shows as completed (SQLite persisted) |

**Performance Measurement:** Wrap `optimisticCheckOff` with `performance.now()` in dev build. Log delta. Must be < 100ms on mid-range Android 2GB RAM device.

---

### TC-014: One-Tap Check-Off — Offline (Airplane Mode)

**Type:** Offline  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enable airplane mode | — |
| 2 | Open app | App loads normally (SQLite local) |
| 3 | Tap check-off | Identical behavior to online mode |
| 4 | No error messages | No "No internet connection" errors appear |
| 5 | Disable airplane mode | No sync needed (Phase 1 is fully local) |

---

### TC-015: One-Tap Check-Off — Undo Within 5 Seconds

**Type:** Functional  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Check off an activity | Activity shows completed |
| 2 | Within 5 seconds, tap "Undo" in snackbar | Activity reverts to unchecked |
| 3 | Verify SQLite | Log entry deleted from activity_logs |

---

### TC-016: One-Tap Check-Off — Rapid Double Tap (Idempotency)

**Type:** Edge Case  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Tap check-off button 3 times rapidly | Activity shows completed state once |
| 2 | Verify SQLite | Only 1 log entry for today |
| 3 | Verify streak | Streak incremented once, not 3 times |

---

### TC-017: Data Persistence — Full Reset Test

**Type:** Data Integrity  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Create 5 activities | — |
| 2 | Check off 3 of them | — |
| 3 | Force-close app | — |
| 4 | Reopen app | All 5 activities present, 3 showing as completed |
| 5 | Clear app cache (not data) | All 5 activities still present |

---

### TC-018: Data Persistence — Airplane Mode Round Trip

**Type:** Offline / Data Integrity  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enable airplane mode | — |
| 2 | Create 2 activities | — |
| 3 | Check off both | — |
| 4 | Force-close and reopen (still airplane mode) | Both activities persist, both checked off |

---

### TC-019: Localization — Hindi UI Spot Check

**Type:** Localization  
**Priority:** P0

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set language to Hindi | — |
| 2 | Navigate through all Sprint 1 screens | All screen titles in Hindi |
| 3 | Trigger validation error on empty name | Error shows in Hindi |
| 4 | Complete onboarding | All quiz text in Hindi |
| 5 | Check FAB tooltip | "+" label (if any) in Hindi |

---

### TC-020: Performance — Cold Start Time

**Type:** Performance  
**Priority:** P1

| Step | Action | Expected Result |
|---|---|---|
| 1 | Force-close app completely | — |
| 2 | Launch app, start timer | — |
| 3 | Wait for Home screen to be interactive | Timer stops |
| 4 | Measure duration | < 2 seconds on Redmi Note 5 (Android 8) |

---

## 4. Performance Testing Approach

### Check-Off Latency (< 100ms)
```typescript
// Wrap optimisticCheckOff in dev build:
const start = performance.now();
optimisticCheckOff(activityId);
const end = performance.now();
console.log(`Check-off UI latency: ${end - start}ms`);
// Should be < 5ms (synchronous Zustand update)
```

### APK Size Tracking
- Run `eas build --profile preview --platform android` after Sprint 3
- Download APK, check with `ls -la *.apk`
- Target: < 15 MB
- If > 15 MB: audit with `npx expo-bundle-analyzer`

### Memory Usage
- Use Android Studio Profile (Memory tab) during 10-minute usage session
- Target: < 100 MB typical heap usage
- Watch for memory leaks: re-render loops, unmounted component state updates

---

## 5. Test Execution Template

```
Test Run Date: ___________
Tester: Vikas
Build: Expo Go (Dev) / EAS Preview Build
Device: ___________
OS Version: ___________
Language tested: Hindi / English / Tamil / Telugu

| TC # | Test Name | Result | Notes |
|------|-----------|--------|-------|
| TC-001 | Language Selection | PASS/FAIL | |
| TC-002 | English Default | PASS/FAIL | |
| ... | ... | ... | |

Bugs Found:
- BUG-001: [Description] — Severity: Critical/High/Medium/Low
  Steps to reproduce: ...
  
Overall Result: PASS / FAIL (with open bugs listed)
Sign-off: Vikas ___________
```

---

## 6. Bug Severity Definitions

| Severity | Definition | Example | SLA |
|---|---|---|---|
| Critical | App crash or data loss | Check-off crashes app | Fix before release |
| High | Core feature broken | Language not persisting | Fix this sprint |
| Medium | Feature partially broken | Character counter not showing | Fix next sprint |
| Low | Visual/cosmetic issue | Button slightly off-center | Backlog |

---

## 7. Regression Testing (Sprint 2+)

All TC-001 through TC-020 must be re-run at the start of every sprint before marking Sprint N as complete. Failed tests from previous sprints that were marked "known issue" must be re-verified.
