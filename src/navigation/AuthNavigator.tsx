import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '@screens/auth/SignInScreen';
import { SignUpScreen } from '@screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{ headerShown: true, headerBackTitleVisible: false }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
}
