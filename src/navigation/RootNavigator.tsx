import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@store/settingsStore';
import { useAuthStore } from '@store/authStore';
import { getSettings } from '@services/db/settingsRepo';
import { getSession, getCurrentUser } from '@services/supabase/authService';
import { LanguageSelectionScreen } from '@screens/LanguageSelectionScreen';
import { OnboardingQuizScreen } from '@screens/OnboardingQuizScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { BadgesScreen } from '@screens/BadgesScreen';
import { PaywallScreen } from '@screens/paywall/PaywallScreen';
import { TeamScreen } from '@screens/team/TeamScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { onboardingComplete, loadFromDB } = useSettingsStore();
  const { setUser, setLoading, setLocalOnly } = useAuthStore();

  useEffect(() => {
    async function init() {
      // Load local settings
      const s = await getSettings();
      loadFromDB({
        language: s.language,
        theme: s.theme,
        notification_enabled: s.notification_enabled,
        onboarding_complete: s.onboarding_complete,
      });

      // Restore Supabase session if exists (non-blocking — local mode still works)
      try {
        const session = await getSession();
        if (session) {
          const user = await getCurrentUser();
          if (user) {
            setUser(user);
          } else {
            setLocalOnly(true);
          }
        } else {
          setLocalOnly(true);
        }
      } catch {
        setLocalOnly(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadFromDB, setUser, setLocalOnly, setLoading]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!onboardingComplete ? (
          <>
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
            <Stack.Screen name="OnboardingQuiz" component={OnboardingQuizScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="BadgesModal"
              component={BadgesScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Team"
              component={TeamScreen}
              options={{ headerShown: true, title: 'Team Workspace' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
