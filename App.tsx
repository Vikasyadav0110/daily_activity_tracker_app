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
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
});

function AppContent() {
  const theme = useSettingsStore((s) => s.theme);
  const paperTheme = theme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

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
