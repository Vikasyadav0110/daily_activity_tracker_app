import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  LanguageSelection: undefined;
  OnboardingQuiz: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ActivityCreationModal: undefined;
  BadgesScreen: undefined;
};

export type ExamStackParamList = {
  ExamPrepScreen: { activityId: number };
  StudyLogModal: { examId: number };
  MockTestModal: { examId: number };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type HomeTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type SettingsNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Settings'>;

export type ActivityCreationModalRouteProp = RouteProp<HomeStackParamList, 'ActivityCreationModal'>;
