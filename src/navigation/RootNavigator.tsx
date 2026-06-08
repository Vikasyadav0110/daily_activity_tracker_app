import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '@store/settingsStore';
import { getSettings } from '@services/db/settingsRepo';
import { LanguageSelectionScreen } from '@screens/LanguageSelectionScreen';
import { OnboardingQuizScreen } from '@screens/OnboardingQuizScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { onboardingComplete, loadFromDB } = useSettingsStore();

  useEffect(() => {
    getSettings().then((s) => {
      loadFromDB({
        language: s.language,
        theme: s.theme,
        notification_enabled: s.notification_enabled,
        onboarding_complete: s.onboarding_complete,
      });
    });
  }, [loadFromDB]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!onboardingComplete ? (
          <>
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
            <Stack.Screen name="OnboardingQuiz" component={OnboardingQuizScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
