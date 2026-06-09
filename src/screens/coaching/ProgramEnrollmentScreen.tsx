import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';
import {
  getHabitPrograms, getProgramTasks, getUserPrograms,
  completeTask,
  type HabitProgram, type ProgramTask, type UserProgram,
} from '@services/ai/coachingService';

type RouteProps = RouteProp<RootStackParamList, 'ProgramEnrollment'>;

const TASK_TYPE_ICONS: Record<string, string> = {
  habit:      '✅',
  reflection: '📝',
  challenge:  '⚡',
  rest:       '😴',
};

const CATEGORY_COLORS: Record<string, string> = {
  fitness:      '#1565C0',
  mindfulness:  '#2E7D32',
  productivity: '#6A1B9A',
  spiritual:    '#E65100',
  custom:       '#BF360C',
};

export default function ProgramEnrollmentScreen() {
  const theme = useTheme() as MD3Theme;
  const route = useRoute<RouteProps>();
  const { programId, userProgramId } = route.params;

  const [program, setProgram] = useState<HabitProgram | null>(null);
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [tasks, setTasks] = useState<ProgramTask[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [programs, userPrograms] = await Promise.all([
        getHabitPrograms(),
        getUserPrograms(),
      ]);
      const p = programs.find((x) => x.id === programId) ?? null;
      const up = userPrograms.find((x) => x.id === userProgramId) ?? null;
      setProgram(p);
      setUserProgram(up);

      if (up) {
        const t = await getProgramTasks(programId, up.current_day);
        setTasks(t);
      }
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [programId, userProgramId]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    setSavingTaskId(taskId);
    try {
      await completeTask(userProgramId, taskId, reflections[taskId]);
      setCompletedTaskIds((prev) => new Set([...prev, taskId]));
    } catch {
      Alert.alert('Error', 'Could not save task. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  }, [userProgramId, reflections]);

  const s = styles(theme);
  const accentColor = CATEGORY_COLORS[program?.category ?? ''] ?? '#1565C0';

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  const completedCount = completedTaskIds.size;
  const totalTasks = tasks.length;
  const progressPct = totalTasks ? (completedCount / totalTasks) * 100 : 0;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Program header */}
      <View style={[s.header, { borderColor: accentColor + '40' }]}>
        <View style={s.headerRow}>
          <Text style={[s.dayBadge, { backgroundColor: accentColor }]}>
            Day {userProgram?.current_day ?? 1}
          </Text>
          <Text style={[s.programTitle, { color: accentColor }]} numberOfLines={1}>
            {program?.title ?? 'Program'}
          </Text>
        </View>
        <View style={s.progressRow}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: accentColor }]} />
          </View>
          <Text style={s.progressText}>{completedCount}/{totalTasks} done</Text>
        </View>
        <Text style={s.overallPct}>
          Overall: {Math.round(userProgram?.completion_pct ?? 0)}% complete
          {'  ·  '}
          {program?.duration_days ?? 0} day program
        </Text>
      </View>

      {/* Today's tasks */}
      <Text style={s.sectionTitle}>Today's Tasks</Text>

      {tasks.length === 0 ? (
        <View style={s.emptyTasks}>
          <Text style={s.emptyText}>😴 Rest day — no tasks today. Recover and come back stronger!</Text>
        </View>
      ) : (
        tasks.map((task) => {
          const done = completedTaskIds.has(task.id);
          return (
            <View key={task.id} style={[s.taskCard, done && s.taskDone]}>
              <View style={s.taskHeader}>
                <Text style={s.taskIcon}>{TASK_TYPE_ICONS[task.task_type] ?? '📌'}</Text>
                <View style={s.taskMeta}>
                  <Text style={[s.taskTitle, done && s.taskTitleDone]}>{task.title}</Text>
                  {task.duration_minutes && (
                    <Text style={s.taskDuration}>{task.duration_minutes} min · +{task.xp_reward} XP</Text>
                  )}
                </View>
                {done && <Text style={s.doneCheck}>✓</Text>}
              </View>
              {task.description && (
                <Text style={s.taskDescription}>{task.description}</Text>
              )}
              {task.task_type === 'reflection' && !done && (
                <TextInput
                  value={reflections[task.id] ?? ''}
                  onChangeText={(v) => setReflections((prev) => ({ ...prev, [task.id]: v }))}
                  placeholder="Write your reflection…"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  style={s.reflectionInput}
                  multiline
                  numberOfLines={3}
                />
              )}
              {!done && (
                <TouchableOpacity
                  onPress={() => handleCompleteTask(task.id)}
                  disabled={savingTaskId === task.id}
                  style={[s.completeButton, { backgroundColor: accentColor }]}
                >
                  {savingTaskId === task.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.completeText}>Mark Complete</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      {/* All-done state */}
      {completedCount === totalTasks && totalTasks > 0 && (
        <View style={[s.allDoneCard, { backgroundColor: accentColor + '18' }]}>
          <Text style={s.allDoneEmoji}>🎉</Text>
          <Text style={[s.allDoneTitle, { color: accentColor }]}>Day Complete!</Text>
          <Text style={s.allDoneText}>
            Great work! Come back tomorrow for Day {(userProgram?.current_day ?? 1) + 1}.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = (theme: MD3Theme) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.colors.background },
  content:         { padding: 20, paddingBottom: 40 },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:          { padding: 16, borderRadius: 16, borderWidth: 1.5, backgroundColor: theme.colors.surface, marginBottom: 24 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dayBadge:        { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  programTitle:    { fontSize: 16, fontWeight: '700', flex: 1 },
  progressRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  progressBar:     { flex: 1, height: 6, backgroundColor: theme.colors.surfaceVariant, borderRadius: 3, overflow: 'hidden' },
  progressFill:    { height: 6, borderRadius: 3 },
  progressText:    { fontSize: 12, color: theme.colors.onSurfaceVariant, width: 60, textAlign: 'right' },
  overallPct:      { fontSize: 12, color: theme.colors.onSurfaceVariant },
  sectionTitle:    { fontSize: 17, fontWeight: '700', color: theme.colors.onBackground, marginBottom: 14 },
  emptyTasks:      { padding: 20, backgroundColor: theme.colors.surface, borderRadius: 14, alignItems: 'center' },
  emptyText:       { fontSize: 14, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
  taskCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.outlineVariant,
  },
  taskDone:        { opacity: 0.6 },
  taskHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  taskIcon:        { fontSize: 22, width: 28 },
  taskMeta:        { flex: 1 },
  taskTitle:       { fontSize: 15, fontWeight: '600', color: theme.colors.onSurface },
  taskTitleDone:   { textDecorationLine: 'line-through', color: theme.colors.onSurfaceVariant },
  taskDuration:    { fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  taskDescription: { fontSize: 13, color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: 12 },
  doneCheck:       { fontSize: 18, color: '#2E7D32', fontWeight: '700' },
  reflectionInput: {
    borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: 10, padding: 10, minHeight: 72,
    color: theme.colors.onSurface, fontSize: 14,
    marginBottom: 10, textAlignVertical: 'top',
  },
  completeButton:  { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  completeText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  allDoneCard:     { borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 8 },
  allDoneEmoji:    { fontSize: 40, marginBottom: 10 },
  allDoneTitle:    { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  allDoneText:     { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
