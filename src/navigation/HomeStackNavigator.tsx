import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/HomeScreen';
import { BadgesScreen } from '@screens/BadgesScreen';
import { ExamPrepScreen } from '@screens/ExamPrepScreen';
import type { HomeStackParamList } from './types';

// Only screens registered here — ExamPrepScreen borrows its params inline
type HomeNavParamList = HomeStackParamList & {
  ExamPrepScreen: { activityId: number };
};

const Stack = createNativeStackNavigator<HomeNavParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="BadgesScreen" component={BadgesScreen} />
      <Stack.Screen name="ExamPrepScreen" component={ExamPrepScreen} />
    </Stack.Navigator>
  );
}
