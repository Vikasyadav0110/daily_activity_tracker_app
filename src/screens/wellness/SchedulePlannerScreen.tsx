import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator, Chip, Divider, type MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  generateSchedule,
  getCurrentPlan,
  type ScheduleItem,
  type GeneratedSchedule,
} from '@services/ai/scheduleService';
import { useProStore } from '@store/proStore';
import { PremiumPlusGate } from '@components/common/PremiumPlusGate';

const PHASE3_COLOR = '#6A1B9A';

const GOAL_PRESETS = [
  { label: '📚 Study', value: 'daily_study' },
  { label: '🏃 Fitness', value: 'daily_fitness' },
  { label: '🧘 Meditation', value: 'morning_meditation' },
  { label: '💼 Work Focus', value: 'deep_work' },
  { label: '🌿 Ayurveda Routine', value: 'ayurveda_routine' },
  { label: '🙏 Spiritual Practice', value: 'spiritual_practice' },
  { label: '📖 Reading', value: 'daily_reading' },
  { label: '💤 Better Sleep', value: 'sleep_hygiene' },
];

const CATEGORY_COLORS: Record<string, string> = {
  morning: '#FF7043',
  work: '#1565C0',
  fitness: '#2E7D32',
  wellness: '#6A1B9A',
  spiritual: '#E65100',
  evening: '#37474F',
  sleep: '#283593',
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? PHASE3_COLOR;
}

export function SchedulePlannerScreen() {
  const theme = useTheme();
  useTranslation();
  const navigation = useNavigation();
  useProStore((s) => s.isPremiumPlus);

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState('8');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [generating, setGenerating] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<GeneratedSchedule | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  async function loadCurrentPlan() {
    setLoadingCurrent(true);
    try {
      const result = await getCurrentPlan();
      if (result) {
        setCurrentSchedule({
          id: result.plan.id,
          plan_name: result.plan.plan_name,
          schedule: result.schedule,
          note: '',
          ai_generated: result.plan.plan_type === 'ai_generated',
        });
      }
    } finally {
      setLoadingCurrent(false);
    }
  }

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleGenerate() {
    if (selectedGoals.length === 0) {
      Alert.alert('Select Goals', 'Please select at least one goal to generate your schedule.');
      return;
    }
    const hours = parseFloat(availableHours);
    if (isNaN(hours) || hours < 1 || hours > 18) {
      Alert.alert('Invalid Hours', 'Available hours must be between 1 and 18.');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateSchedule(selectedGoals, hours, wakeTime);
      if (result) {
        setCurrentSchedule(result);
        Alert.alert(
          result.ai_generated ? '🧠 AI Schedule Ready' : '📅 Template Schedule Ready',
          result.note || 'Your personalised daily plan is ready!'
        );
      } else {
        Alert.alert('Error', 'Failed to generate schedule. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.primary, fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          📅 Smart Scheduler
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <PremiumPlusGate feature="AI Smart Scheduling">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Generator form */}
          <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
              Your Goals
            </Text>
            <View style={styles.chipRow}>
              {GOAL_PRESETS.map((g) => (
                <Chip
                  key={g.value}
                  selected={selectedGoals.includes(g.value)}
                  onPress={() => toggleGoal(g.value)}
                  style={[
                    styles.chip,
                    selectedGoals.includes(g.value) && { backgroundColor: PHASE3_COLOR + '20' },
                  ]}
                  selectedColor={PHASE3_COLOR}
                  compact
                >
                  {g.label}
                </Chip>
              ))}
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Available Hours/Day
                </Text>
                <TextInput
                  value={availableHours}
                  onChangeText={setAvailableHours}
                  keyboardType="numeric"
                  style={[styles.input, {
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surfaceVariant,
                  }]}
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Wake Time (IST)
                </Text>
                <TextInput
                  value={wakeTime}
                  onChangeText={setWakeTime}
                  placeholder="06:00"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  style={[styles.input, {
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surfaceVariant,
                  }]}
                  maxLength={5}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: generating ? theme.colors.surfaceVariant : PHASE3_COLOR }]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={PHASE3_COLOR} />
              ) : (
                <Text style={styles.generateBtnText}>
                  🧠 Generate AI Schedule
                </Text>
              )}
            </TouchableOpacity>
          </Surface>

          {/* Current schedule */}
          {loadingCurrent ? (
            <ActivityIndicator color={PHASE3_COLOR} style={{ marginTop: 32 }} />
          ) : currentSchedule ? (
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleHeader}>
                <Text style={[styles.scheduleName, { color: theme.colors.onBackground }]}>
                  {currentSchedule.plan_name}
                </Text>
                {currentSchedule.ai_generated && (
                  <View style={[styles.aiBadge, { backgroundColor: PHASE3_COLOR }]}>
                    <Text style={styles.aiBadgeText}>🧠 AI</Text>
                  </View>
                )}
              </View>

              {currentSchedule.schedule.map((item, i) => (
                <ScheduleRow key={i} item={item} theme={theme} />
              ))}
            </View>
          ) : (
            <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No Schedule Yet
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>
                Select your goals above and generate your personalised daily plan.
              </Text>
            </Surface>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </PremiumPlusGate>
    </SafeAreaView>
  );
}

function ScheduleRow({ item, theme }: { item: ScheduleItem; theme: MD3Theme }) {
  const color = categoryColor(item.category);
  return (
    <View style={styles.scheduleRow}>
      <View style={[styles.timeBlock, { backgroundColor: color + '15' }]}>
        <Text style={[styles.timeText, { color }]}>{item.time}</Text>
        <Text style={[styles.durationText, { color: theme.colors.onSurfaceVariant }]}>
          {item.duration}m
        </Text>
      </View>
      <View style={styles.scheduleContent}>
        <Text style={[styles.activityName, { color: theme.colors.onSurface }]}>
          {item.activity}
        </Text>
        {item.note ? (
          <Text style={[styles.activityNote, { color: theme.colors.onSurfaceVariant }]}>
            {item.note}
          </Text>
        ) : null}
        <View style={[styles.categoryTag, { backgroundColor: color + '15' }]}>
          <Text style={[styles.categoryTagText, { color }]}>{item.category}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, gap: 16 },
  formCard: { borderRadius: 20, padding: 16, gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  generateBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  generateBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  scheduleSection: { gap: 10 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  scheduleName: { flex: 1, fontSize: 16, fontWeight: '700' },
  aiBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiBadgeText: { color: 'white', fontSize: 11, fontWeight: '800' },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  timeBlock: { width: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 8 },
  timeText: { fontSize: 13, fontWeight: '800' },
  durationText: { fontSize: 10 },
  scheduleContent: { flex: 1, gap: 4 },
  activityName: { fontSize: 14, fontWeight: '600' },
  activityNote: { fontSize: 12, lineHeight: 16 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  categoryTagText: { fontSize: 10, fontWeight: '700' },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, marginTop: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
