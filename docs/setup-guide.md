# Local Development Setup Guide
## Daily Activity Tracker — India Edition

**DevOps Role:** Claude  
**For:** Vikas (Founder/Developer)  
**Last Updated:** 2026-06-08

---

## Prerequisites

### Required Tools

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| npm | 10.x (bundled with Node 20) | — |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Git | 2.x+ | `brew install git` (macOS) |
| Watchman | Latest | `brew install watchman` (macOS, required for React Native) |

### For iOS Development (macOS only)
- Xcode 15+ (App Store)
- iOS Simulator (included with Xcode)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development
- Android Studio (for emulator)
- Android SDK (installed via Android Studio)
- Set `ANDROID_HOME` in `~/.zshrc`:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/daily-activity-tracker.git
cd daily-activity-tracker
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all packages from `package.json`. Should take 2–5 minutes on first run.

---

## Step 3: Environment Variables

```bash
cp .env.example .env
```

Edit `.env` for local development:
```env
# Leave SENTRY_DSN empty for local dev (no crash reporting needed)
SENTRY_DSN=

# Leave PostHog empty for local dev (analytics not needed)
POSTHOG_API_KEY=
```

---

## Step 4: EAS Setup (one-time)

```bash
# Login to your Expo account (create one at expo.dev if needed)
eas login

# Link this project to EAS
eas init
# This will update app.json with your projectId

# Verify EAS config
eas build:configure
```

---

## Step 5: Run Locally

### On Android Emulator
```bash
# Start Android emulator first via Android Studio, then:
npm run android
# OR
npx expo start --android
```

### On iOS Simulator (macOS only)
```bash
npm run ios
# OR
npx expo start --ios
```

### On Physical Device (recommended for performance testing)
```bash
# Install Expo Go from App Store / Google Play
npx expo start
# Scan the QR code with Expo Go (Android) or Camera (iOS)
```

### Development server only
```bash
npx expo start
# Press 'a' for Android, 'i' for iOS, scan QR for device
```

---

## Step 6: Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Specific file
npx jest __tests__/unit/streakCalculator.test.ts

# Watch mode (during development)
npx jest --watch
```

Expected output:
```
PASS __tests__/unit/streakCalculator.test.ts
PASS __tests__/unit/dateUtils.test.ts
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```

---

## Step 7: TypeScript Check

```bash
npm run typecheck
# Should output: nothing (zero errors)
```

---

## Step 8: Linting

```bash
npm run lint
# Should output: nothing (zero warnings)

# Auto-fix
npm run lint:fix
```

---

## Step 9: Build Preview APK (for testing on real Android)

```bash
# Requires EAS CLI logged in
eas build --platform android --profile preview

# After build completes, download and install the APK on your test device
# Check APK size: should be < 15 MB
```

---

## Development Workflow

### Daily workflow

```bash
# 1. Pull latest
git pull origin develop

# 2. Start dev server
npx expo start

# 3. Code, test on device/emulator

# 4. Before committing
npm run typecheck && npm run lint && npm test

# 5. Commit
git add src/__tests__
git commit -m "feat: implement activity check-off with optimistic update"

# 6. Push and open PR to develop
git push origin feature/my-feature
```

### Branch naming
- `feature/us-001-language-selection` — new feature
- `fix/tc-013-checkoff-latency` — bug fix
- `chore/update-deps` — maintenance

---

## Troubleshooting

### "Metro bundler not starting"
```bash
# Clear cache
npx expo start --clear
```

### "SQLite migration failed"
```bash
# Reset app data (Expo Go → long press app icon → Clear Data)
# Then relaunch
```

### "Module not found @components/..."
```bash
# Path aliases not resolving — verify babel.config.js has module-resolver
# And tsconfig.json has matching paths entries
```

### "Expo Go version mismatch"
```bash
# Update Expo Go app on device
# OR downgrade SDK: change expo version in package.json and npm install
```

### "Android build fails with signing error"
```bash
# For preview builds: EAS handles signing automatically
# For local: run expo run:android (not expo build)
```

---

## EAS Build Profiles

| Profile | Use Case | Distribution |
|---|---|---|
| `development` | Local device with dev client | Internal |
| `preview` | Shareable APK for testing | Internal (direct install) |
| `production` | App Store / Play Store | Public |

```bash
# Development build (with dev menu)
eas build --platform android --profile development

# Preview APK (for sharing with testers)
eas build --platform android --profile preview

# Production build (for store submission)
eas build --platform android --profile production
```

---

## Recommended VS Code Extensions

- **ESLint** — Real-time linting
- **Prettier** — Auto-formatting on save
- **React Native Tools** — Debugging support
- **TypeScript + JavaScript Language Features** — Built-in
- **GitLens** — Enhanced git blame

**VS Code settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Architecture Quick Reference

```
App.tsx
  └─ providers (QueryClient, PaperProvider, GestureHandler)
     └─ RootNavigator
        ├─ if !onboardingComplete
        │    ├─ LanguageSelectionScreen
        │    └─ OnboardingQuizScreen
        └─ if onboardingComplete
             └─ MainTabNavigator (bottom tabs)
                  ├─ HomeScreen (tab 1)
                  ├─ ProgressScreen (tab 2)
                  └─ SettingsScreen (tab 3)
```

Data flow:
```
User tap
  → ActivityListItem.tsx (optimistic UI via Zustand)
  → logsRepo.logActivity() (async SQLite write)
  → streaksRepo.updateStreak() (async)
  → badgeEngine.evaluate() (async)
  → React Query cache invalidation → UI re-render
```
