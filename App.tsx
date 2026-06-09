import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { RootNavigator } from '@navigation/RootNavigator';
import { useSettingsStore } from '@store/settingsStore';
import { lightTheme, darkTheme } from '@constants/colors';
import { initDatabase } from '@services/db/database';
import {
  setupAndroidChannel,
  requestNotificationPermissions,
  scheduleDailyCheckIns,
  scheduleStreakAtRiskNotifications,
} from '@services/notifications/notificationService';
import { syncNow } from '@services/supabase/syncService';
import { useAuthStore } from '@store/authStore';
import { useXPStore } from '@store/xpStore';
import { useProStore } from '@store/proStore';
import { refreshWidgetData } from '@services/widget/widgetDataService';
import '@i18n/index';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
});

function AppContent() {
  const theme = useSettingsStore((s) => s.theme);
  const paperTheme = theme === 'dark' ? darkTheme : lightTheme;
  const authUser = useAuthStore((s) => s.user);
  const loadXP = useXPStore((s) => s.loadXP);
  const loadSubscription = useProStore((s) => s.loadSubscription);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await setupAndroidChannel();
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleDailyCheckIns();
          await scheduleStreakAtRiskNotifications();
        }
        loadXP().catch(() => {});
        loadSubscription().catch(() => {});
        refreshWidgetData().catch(() => {});
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // Trigger a background sync whenever the user signs in
  useEffect(() => {
    if (authUser?.id) {
      syncNow(authUser.id).catch(() => {/* non-fatal */});
    }
  }, [authUser?.id]);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </PaperProvider>
  );
}

export default Sentry.wrap(function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
});
