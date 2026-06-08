# Sprint 1 Project Board (Week 1–2)
## Daily Activity Tracker — India Edition

**Sprint Goal:** Working app with language selection, onboarding, activity creation + logging, one-tap check-off, and SQLite persistence. All features work 100% offline.

**Sprint Dates:** Week 1 (Day 1–5) + Week 2 (Day 6–10)  
**Team:** Claude (BA/PM/Dev/QA/DevOps) + Vikas (Product Owner)  
**Definition of Done:** Feature works on Android 8+ and iOS 13+, tests pass, TypeScript compiles clean, no critical bugs.

---

## Week 1 Task Board

| # | Task | Role | Est (h) | Status | Depends On | Priority |
|---|---|---|---|---|---|---|
| W1-1 | Write 5 user stories with Gherkin AC | BA | 2 | ✅ Done | — | P0 |
| W1-2 | Create Raj's journey map (Day 1–14) | BA | 2 | ✅ Done | W1-1 | P0 |
| W1-3 | Sprint board + PRD + test plan docs | PM/BA/QA | 3 | ✅ Done | W1-1 | P0 |
| W1-4 | DevOps: GitHub repo + CI/CD setup guide | DevOps | 2 | ✅ Done | — | P0 |
| W1-5 | Project config files (package.json, app.json, tsconfig, babel, eas.json) | Dev | 1 | ✅ Done | — | P0 |
| W1-6 | SQLite schema migration (001_initial.sql) | Dev | 2 | ✅ Done | W1-5 | P0 |
| W1-7 | Database service (database.ts + migration runner) | Dev | 2 | ✅ Done | W1-6 | P0 |
| W1-8 | activitiesRepo.ts (CRUD) | Dev | 3 | ✅ Done | W1-7 | P0 |
| W1-9 | logsRepo.ts + streaksRepo.ts | Dev | 3 | ✅ Done | W1-7 | P0 |
| W1-10 | settingsRepo.ts + badgesRepo.ts | Dev | 2 | ✅ Done | W1-7 | P0 |
| W1-11 | i18n setup (i18next + 5 locale files) | Dev | 3 | ✅ Done | W1-5 | P0 |
| W1-12 | Constants: colors, typography, categories, examTypes | Dev | 2 | ✅ Done | — | P0 |
| W1-13 | Zustand stores (activitiesStore, settingsStore, onboardingStore) | Dev | 3 | ✅ Done | W1-8 | P0 |
| W1-14 | Utility functions (dateUtils, streakCalculator, formatters) | Dev | 3 | ✅ Done | — | P0 |

---

## Week 2 Task Board

| # | Task | Role | Est (h) | Status | Depends On | Priority |
|---|---|---|---|---|---|---|
| W2-1 | Navigation (RootNavigator, MainTabNavigator, types) | Dev | 2 | ✅ Done | W1-13 | P0 |
| W2-2 | Common components (Button, Card, BottomSheet, LoadingSpinner) | Dev | 3 | ✅ Done | W1-12 | P0 |
| W2-3 | LanguageSelectionScreen.tsx | Dev | 2 | ✅ Done | W1-11, W2-2 | P0 |
| W2-4 | OnboardingQuizScreen.tsx | Dev | 4 | ✅ Done | W2-3, W1-8 | P0 |
| W2-5 | HomeScreen.tsx + DailyScheduleView | Dev | 3 | ✅ Done | W2-1, W1-8 | P0 |
| W2-6 | ActivityListItem.tsx (< 100ms check-off) | Dev | 3 | ✅ Done | W1-13 | P0 |
| W2-7 | ActivityCreationModal.tsx | Dev | 4 | ✅ Done | W2-2, W1-8 | P0 |
| W2-8 | App.tsx (root entry, providers) | Dev | 1 | ✅ Done | W2-1 | P0 |
| W2-9 | 20 unit tests (streakCalculator + dateUtils) | QA/Dev | 3 | ✅ Done | W1-14 | P0 |
| W2-10 | Integration tests (activitiesRepo, logsRepo) | QA/Dev | 2 | ⬜ Pending | W1-8,9 | P1 |
| W2-11 | GitHub Actions CI workflow (ci.yml) | DevOps | 1 | ✅ Done | W1-5 | P0 |
| W2-12 | Local dev setup guide (setup-guide.md) | DevOps | 1 | ✅ Done | — | P0 |
| W2-13 | Performance audit: check-off latency measurement | QA | 1 | ⬜ Pending | W2-6 | P1 |
| W2-14 | Manual QA pass (onboarding → create activity → check-off) | QA | 2 | ⬜ Pending | W2-4,7 | P1 |
| W2-15 | Sprint 1 retrospective + Sprint 2 planning | PM | 1 | ⬜ Pending | All | P1 |

---

## Critical Path

```
Config Files (W1-5)
       ↓
SQLite Schema (W1-6) → database.ts (W1-7) → Repos (W1-8,9,10)
       ↓                                              ↓
i18n setup (W1-11)                          Zustand stores (W1-13)
       ↓                                              ↓
Language Screen (W2-3) ────────────────→ Navigation (W2-1)
       ↓                                              ↓
Onboarding Quiz (W2-4)                      HomeScreen (W2-5)
                   ↓                              ↓
                ActivityCreationModal (W2-7) + ActivityListItem (W2-6)
                                    ↓
                               [SPRINT 1 COMPLETE]
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| expo-sqlite v2 API breaking change | Low | High | Pin to exact version in package.json; test migration runner early |
| Hindi fonts not rendering on older Android | Medium | Medium | Test on Redmi Note 5 (Android 8) explicitly; use system fonts not custom |
| Check-off latency > 100ms on low-end device | Medium | High | Optimistic Zustand update before any DB write; profile on emulator |
| i18n string missing causing blank text | Low | Medium | Fallback to 'en' key; run `npx i18next-parser` to find missing keys |
| EAS Build failure (signing config) | Low | High | Set up signing keys Week 1; don't leave to last day |

---

## Sprint 1 Exit Criteria (QA Checklist)

- [ ] App launches with language selection on fresh install
- [ ] Hindi, English, Tamil, Telugu, Bengali UI renders without overflow
- [ ] Onboarding quiz completes and creates starter activities
- [ ] Activities persist across app restart
- [ ] One-tap check-off responds in < 100ms (visual)
- [ ] Check-off persists after app restart
- [ ] Activity creation modal validates all fields
- [ ] All 20 unit tests pass (`npm test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] ESLint clean (`npm run lint`)
- [ ] App runs on Android emulator (API 27+) via Expo Go
- [ ] App runs on iOS simulator (iOS 13+) via Expo Go
- [ ] No high-severity crashes in 30-minute smoke test

---

## Sprint 2 Preview (Week 3–4)

| Feature | Estimate |
|---|---|
| Streak calculation algorithm + 48h forgiveness | 4h |
| streaks table wired to check-off flow | 2h |
| StreakBadge component | 2h |
| CalendarHeatmap (react-native-calendars) | 4h |
| Push notification service (expo-notifications) | 4h |
| Morning check-in + evening recap notifications | 2h |
| Notification scheduling UI (Settings screen) | 3h |
| Hindi/Tamil/Telugu notification templates | 2h |
| Daily summary card (ProgressScreen) | 3h |
| Sprint 2 tests (notification delivery, streak edge cases) | 3h |
| **Total** | **29h** |
