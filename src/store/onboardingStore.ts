import { create } from 'zustand';
import type { ExamType } from '@services/db/examRepo';

type OnboardingGoal = 'exam' | 'fitness' | 'spiritual' | 'productivity';

interface OnboardingState {
  step: number;
  goal: OnboardingGoal | null;
  examType: ExamType | null;
  dailyHoursTarget: number;
  activityCountTarget: '1_2' | '3_5' | '6_10';
  setStep: (step: number) => void;
  setGoal: (goal: OnboardingGoal) => void;
  setExamType: (examType: ExamType) => void;
  setDailyHoursTarget: (hours: number) => void;
  setActivityCountTarget: (count: '1_2' | '3_5' | '6_10') => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  goal: null,
  examType: null,
  dailyHoursTarget: 4,
  activityCountTarget: '3_5',

  setStep: (step) => set({ step }),
  setGoal: (goal) => set({ goal }),
  setExamType: (examType) => set({ examType }),
  setDailyHoursTarget: (hours) => set({ dailyHoursTarget: hours }),
  setActivityCountTarget: (count) => set({ activityCountTarget: count }),
  reset: () =>
    set({
      step: 1,
      goal: null,
      examType: null,
      dailyHoursTarget: 4,
      activityCountTarget: '3_5',
    }),
}));
