import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@store/onboardingStore';
import { useSettingsStore } from '@store/settingsStore';
import { useActivitiesStore } from '@store/activitiesStore';
import { createActivity } from '@services/db/activitiesRepo';
import { createExamPrep } from '@services/db/examRepo';
import { getExamConfig } from '@constants/examTypes';
import { Button } from '@components/common/Button';
import type { ExamType } from '@services/db/examRepo';

type Goal = 'exam' | 'fitness' | 'spiritual' | 'productivity';
type ActivityCount = '1_2' | '3_5' | '6_10';

interface OptionItem {
  key: string;
  icon: string;
  labelKey: string;
}

const GOALS: OptionItem[] = [
  { key: 'exam',         icon: '🎓', labelKey: 'onboarding.goal_exam' },
  { key: 'fitness',      icon: '💪', labelKey: 'onboarding.goal_fitness' },
  { key: 'spiritual',    icon: '🧘', labelKey: 'onboarding.goal_spiritual' },
  { key: 'productivity', icon: '📊', labelKey: 'onboarding.goal_productivity' },
];

const EXAM_TYPES: OptionItem[] = [
  { key: 'UPSC',    icon: '🏛️', labelKey: 'onboarding.exam_upsc' },
  { key: 'JEE',     icon: '⚗️', labelKey: 'onboarding.exam_jee' },
  { key: 'NEET',    icon: '🩺', labelKey: 'onboarding.exam_neet' },
  { key: 'SSC',     icon: '📋', labelKey: 'onboarding.exam_ssc' },
  { key: 'Banking', icon: '🏦', labelKey: 'onboarding.exam_banking' },
];

const ACTIVITY_COUNTS: OptionItem[] = [
  { key: '1_2',  icon: '1️⃣', labelKey: 'onboarding.activities_1_2' },
  { key: '3_5',  icon: '3️⃣', labelKey: 'onboarding.activities_3_5' },
  { key: '6_10', icon: '6️⃣', labelKey: 'onboarding.activities_6_10' },
];

const STUDY_HOURS: OptionItem[] = [
  { key: '2', icon: '⏱️', labelKey: 'onboarding.hours_2' },
  { key: '4', icon: '⏰', labelKey: 'onboarding.hours_4' },
  { key: '6', icon: '🕐', labelKey: 'onboarding.hours_6' },
  { key: '8', icon: '📅', labelKey: 'onboarding.hours_8_plus' },
];

const STARTER_TEMPLATES: Record<Goal, Array<{ name: string; icon: string; category: string }>> = {
  exam:         [{ name: 'Study Session', icon: '📚', category: 'study' }],
  fitness:      [
    { name: 'Workout',        icon: '💪', category: 'fitness' },
    { name: 'Morning Walk',   icon: '🏃', category: 'fitness' },
    { name: 'Water Intake',   icon: '💧', category: 'health' },
  ],
  spiritual:    [
    { name: 'Morning Pooja',  icon: '🕉️', category: 'spiritual' },
    { name: 'Yoga',           icon: '🧘', category: 'spiritual' },
    { name: 'Meditation',     icon: '☯️', category: 'spiritual' },
  ],
  productivity: [
    { name: 'Morning Planning', icon: '📋', category: 'productivity' },
    { name: 'Deep Work',        icon: '💻', category: 'productivity' },
    { name: 'Reading',          icon: '📖', category: 'productivity' },
  ],
};

export function OnboardingQuizScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const store = useOnboardingStore();
  const { setOnboardingComplete } = useSettingsStore();
  const { addActivity } = useActivitiesStore();
  const [loading, setLoading] = useState(false);

  const totalSteps = store.goal === 'exam' ? 3 : 2;
  const progress = store.step / totalSteps;

  const handleGoalSelect = (goal: Goal) => {
    store.setGoal(goal);
    store.setStep(2);
  };

  const handleExamSelect = (examType: string) => {
    store.setExamType(examType as ExamType);
    store.setStep(3);
  };

  const handleActivityCountSelect = (count: ActivityCount) => {
    store.setActivityCountTarget(count);
    handleComplete();
  };

  const handleHoursSelect = (hours: string) => {
    store.setDailyHoursTarget(Number(hours));
    handleComplete();
  };

  const handleComplete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!store.goal) {
        await handleSkip();
        return;
      }
      const templates = STARTER_TEMPLATES[store.goal];
      for (const tmpl of templates) {
        const activity = await createActivity({
          name: tmpl.name,
          icon: tmpl.icon,
          category: tmpl.category,
          frequency: 'daily',
        });
        if (store.goal === 'exam' && store.examType && tmpl.category === 'study') {
          const config = getExamConfig(store.examType);
          await createExamPrep(
            activity.id,
            store.examType,
            config?.defaultSubjects.map((s) => ({ name: s, completion: 0 })) ?? []
          );
        }
        addActivity(activity);
      }
      setOnboardingComplete(true);
    } catch (e) {
      // Proceed even on error — don't block user
      setOnboardingComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setOnboardingComplete(true);
  };

  const renderOptions = (options: OptionItem[], onSelect: (key: string) => void) => (
    <View style={styles.optionsGrid}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.optionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          onPress={() => onSelect(opt.key)}
          accessibilityRole="button"
          testID={`option-${opt.key}`}
        >
          <Text style={styles.optionIcon}>{opt.icon}</Text>
          <Text style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
            {t(opt.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.progressRow}>
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progressBar}
        />
        <TouchableOpacity onPress={handleSkip} testID="skip-button" style={styles.skipButton}>
          <Text style={{ color: theme.colors.primary, fontSize: 15 }}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {store.step === 1 && (
          <>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('onboarding.step1_title')}
            </Text>
            {renderOptions(GOALS, (key) => handleGoalSelect(key as Goal))}
          </>
        )}

        {store.step === 2 && store.goal === 'exam' && (
          <>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('onboarding.step2_title')}
            </Text>
            {renderOptions(EXAM_TYPES, handleExamSelect)}
          </>
        )}

        {store.step === 2 && store.goal !== 'exam' && (
          <>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('onboarding.step2_fitness_title')}
            </Text>
            {renderOptions(ACTIVITY_COUNTS, (key) => handleActivityCountSelect(key as ActivityCount))}
          </>
        )}

        {store.step === 3 && store.goal === 'exam' && (
          <>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('onboarding.step3_title')}
            </Text>
            {renderOptions(STUDY_HOURS, handleHoursSelect)}
          </>
        )}

        <Button
          label={t('onboarding.get_started')}
          onPress={handleComplete}
          loading={loading}
          style={styles.ctaButton}
          testID="get-started-button"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  skipButton: { paddingVertical: 8, paddingHorizontal: 4 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48, gap: 24 },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  optionsGrid: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  optionIcon: { fontSize: 28 },
  optionLabel: { fontSize: 17, fontWeight: '600', flex: 1 },
  ctaButton: { marginTop: 8 },
});
