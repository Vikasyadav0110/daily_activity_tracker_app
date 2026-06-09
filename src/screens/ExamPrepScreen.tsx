import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  getExamPrepForActivity,
  createExamPrep,
  updateExamPrep,
  logStudySession,
  getStudyLogs,
  logMockTest,
  getMockTests,
  type ExamPrep,
  type ExamLog,
  type MockTest,
  type ExamSubject,
} from '@services/db/examRepo';
import { getActivities } from '@services/db/activitiesRepo';
import { getExamConfig } from '@constants/examTypes';
import { getTodayIST } from '@utils/dateUtils';
import { useOnboardingStore } from '@store/onboardingStore';
import type { ExamStackParamList } from '@navigation/types';

type ExamPrepRouteProp = RouteProp<ExamStackParamList, 'ExamPrepScreen'>;

type Tab = 'subjects' | 'study' | 'tests';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export function ExamPrepScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<ExamPrepRouteProp>();
  const { activityId } = route.params;

  const [loading, setLoading] = useState(true);
  const [prep, setPrep] = useState<ExamPrep | null>(null);
  const [activityName, setActivityName] = useState('');
  const [studyLogs, setStudyLogs] = useState<ExamLog[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('subjects');
  const [toast, setToast] = useState<string | null>(null);

  // Study session form
  const [studySubject, setStudySubject] = useState('');
  const [studyHours, setStudyHours] = useState('');
  const [studyDifficulty, setStudyDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [savingStudy, setSavingStudy] = useState(false);

  // Mock test form
  const [testScore, setTestScore] = useState('');
  const [testTotal, setTestTotal] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [savingTest, setSavingTest] = useState(false);

  const today = getTodayIST();
  const examTypeFromOnboarding = useOnboardingStore((s) => s.examType);

  const load = useCallback(async () => {
    try {
      const activities = await getActivities({ archived: false });
      const activity = activities.find((a) => a.id === activityId);
      if (activity) setActivityName(activity.name);

      let examPrep = await getExamPrepForActivity(activityId);
      if (!examPrep) {
        // Use exam type from onboarding answers; fall back to UPSC
        const examType = examTypeFromOnboarding ?? 'UPSC';
        const config = getExamConfig(examType);
        const defaultSubjects: ExamSubject[] = (config?.defaultSubjects ?? []).map((s) => ({
          name: s,
          completion: 0,
        }));
        examPrep = await createExamPrep(activityId, examType, defaultSubjects);
      }
      setPrep(examPrep);

      const [logs, tests] = await Promise.all([
        getStudyLogs(examPrep.id, 30),
        getMockTests(examPrep.id),
      ]);
      setStudyLogs(logs);
      setMockTests(tests);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activityId, examTypeFromOnboarding]);

  useEffect(() => {
    load();
  }, []);

  const updateSubjectCompletion = async (index: number, delta: number) => {
    if (!prep) return;
    const updated = prep.subjects.map((s, i) => {
      if (i !== index) return s;
      return { ...s, completion: Math.min(100, Math.max(0, s.completion + delta)) };
    });
    const avg = Math.round(updated.reduce((sum, s) => sum + s.completion, 0) / updated.length);
    await updateExamPrep(prep.id, { subjects: updated, syllabus_coverage_pct: avg });
    setPrep({ ...prep, subjects: updated, syllabus_coverage_pct: avg });
  };

  const handleLogStudy = async () => {
    if (!prep || !studySubject.trim() || !studyHours.trim()) return;
    const hours = parseFloat(studyHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setToast(t('exam_prep.invalid_hours'));
      return;
    }
    setSavingStudy(true);
    try {
      await logStudySession(prep.id, studySubject.trim(), hours, studyDifficulty, today);
      const logs = await getStudyLogs(prep.id, 30);
      setStudyLogs(logs);
      setStudySubject('');
      setStudyHours('');
      setStudyDifficulty('medium');
      setToast(t('exam_prep.study_logged'));
    } catch {
      setToast(t('common.error_generic'));
    } finally {
      setSavingStudy(false);
    }
  };

  const handleLogTest = async () => {
    if (!prep || !testScore.trim() || !testTotal.trim()) return;
    const score = parseInt(testScore, 10);
    const total = parseInt(testTotal, 10);
    if (isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) {
      setToast(t('exam_prep.invalid_score'));
      return;
    }
    setSavingTest(true);
    try {
      await logMockTest(prep.id, score, total, today, testSubject.trim() || undefined);
      const tests = await getMockTests(prep.id);
      setMockTests(tests);
      setTestScore('');
      setTestTotal('');
      setTestSubject('');
      setToast(t('exam_prep.test_logged'));
    } catch {
      setToast(t('common.error_generic'));
    } finally {
      setSavingTest(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const config = prep ? getExamConfig(prep.exam_type) : null;
  const totalStudyHours = studyLogs.reduce((sum, l) => sum + l.study_hours, 0);
  const bestTestScore = mockTests.length > 0
    ? Math.max(...mockTests.map((t) => Math.round((t.score / t.total_marks) * 100)))
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: theme.colors.primary }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {activityName || t('exam_prep.title')}
          </Text>
          {config && (
            <Text style={[styles.headerSub, { color: theme.colors.onSurfaceVariant }]}>
              {config.icon} {config.label}
            </Text>
          )}
        </View>
      </View>

      {/* Stats strip */}
      <View style={[styles.statsStrip, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: theme.colors.onPrimaryContainer }]}>
            {prep?.syllabus_coverage_pct ?? 0}%
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.onPrimaryContainer }]}>
            {t('exam_prep.syllabus')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: theme.colors.onPrimaryContainer }]}>
            {totalStudyHours.toFixed(1)}h
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.onPrimaryContainer }]}>
            {t('exam_prep.hours_logged')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: theme.colors.onPrimaryContainer }]}>
            {bestTestScore !== null ? `${bestTestScore}%` : '—'}
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.onPrimaryContainer }]}>
            {t('exam_prep.best_score')}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface }]}>
        {(['subjects', 'study', 'tests'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  fontWeight: activeTab === tab ? '700' : '500',
                },
              ]}
            >
              {t(`exam_prep.tab_${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Subjects tab ────────────────────────────────────── */}
        {activeTab === 'subjects' && prep && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              {t('exam_prep.subject_tracker')}
            </Text>
            {prep.subjects.map((subject, i) => (
              <View
                key={`${subject.name}-${i}`}
                style={[styles.subjectCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.subjectRow}>
                  <Text style={[styles.subjectName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {subject.name}
                  </Text>
                  <Text style={[styles.subjectPct, { color: theme.colors.primary }]}>
                    {subject.completion}%
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${subject.completion}%` as any,
                        backgroundColor:
                          subject.completion >= 100
                            ? '#2E7D32'
                            : subject.completion >= 50
                            ? theme.colors.primary
                            : '#FF6F00',
                      },
                    ]}
                  />
                </View>
                <View style={styles.subjectBtns}>
                  {[-10, -5, +5, +10].map((delta) => (
                    <TouchableOpacity
                      key={delta}
                      onPress={() => updateSubjectCompletion(i, delta)}
                      style={[
                        styles.deltaBtn,
                        {
                          backgroundColor:
                            delta > 0
                              ? theme.colors.primaryContainer
                              : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color:
                            delta > 0
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                        }}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Study Log tab ───────────────────────────────────── */}
        {activeTab === 'study' && (
          <View style={styles.section}>
            {/* Log form */}
            <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('exam_prep.log_session')}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('exam_prep.subject')}
              </Text>
              {/* Subject quick-select from exam config */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {(config?.defaultSubjects ?? []).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStudySubject(s)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          studySubject === s
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          studySubject === s
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <RNTextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder={t('exam_prep.or_type_subject')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={studySubject}
                onChangeText={setStudySubject}
              />

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('exam_prep.hours')}
              </Text>
              <RNTextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder="e.g. 1.5"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="decimal-pad"
                value={studyHours}
                onChangeText={setStudyHours}
              />

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('exam_prep.difficulty')}
              </Text>
              <View style={styles.diffRow}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setStudyDifficulty(d)}
                    style={[
                      styles.diffBtn,
                      {
                        backgroundColor:
                          studyDifficulty === d
                            ? d === 'easy'
                              ? '#E8F5E9'
                              : d === 'medium'
                              ? '#FFF3E0'
                              : '#FFEBEE'
                            : theme.colors.surfaceVariant,
                        borderColor:
                          studyDifficulty === d
                            ? d === 'easy'
                              ? '#2E7D32'
                              : d === 'medium'
                              ? '#E65100'
                              : '#C62828'
                            : 'transparent',
                        borderWidth: studyDifficulty === d ? 1.5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color:
                          d === 'easy' ? '#2E7D32' : d === 'medium' ? '#E65100' : '#C62828',
                      }}
                    >
                      {t(`exam_prep.diff_${d}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleLogStudy}
                disabled={savingStudy || !studySubject.trim() || !studyHours.trim()}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor:
                      savingStudy || !studySubject.trim() || !studyHours.trim()
                        ? theme.colors.surfaceVariant
                        : theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      savingStudy || !studySubject.trim() || !studyHours.trim()
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onPrimary,
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  {savingStudy ? t('common.loading') : t('exam_prep.log_session_btn')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recent logs */}
            {studyLogs.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginTop: 16 }]}>
                  {t('exam_prep.recent_sessions')}
                </Text>
                {studyLogs.map((log) => (
                  <View
                    key={log.id}
                    style={[styles.logRow, { backgroundColor: theme.colors.surface }]}
                  >
                    <View style={styles.logLeft}>
                      <Text style={[styles.logSubject, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {log.subject}
                      </Text>
                      <Text style={[styles.logDate, { color: theme.colors.onSurfaceVariant }]}>
                        {log.log_date}
                      </Text>
                    </View>
                    <View style={styles.logRight}>
                      <Text style={[styles.logHours, { color: theme.colors.primary }]}>
                        {log.study_hours}h
                      </Text>
                      <View
                        style={[
                          styles.diffPill,
                          {
                            backgroundColor:
                              log.difficulty === 'easy'
                                ? '#E8F5E9'
                                : log.difficulty === 'medium'
                                ? '#FFF3E0'
                                : '#FFEBEE',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color:
                              log.difficulty === 'easy'
                                ? '#2E7D32'
                                : log.difficulty === 'medium'
                                ? '#E65100'
                                : '#C62828',
                          }}
                        >
                          {t(`exam_prep.diff_${log.difficulty}`)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Mock Tests tab ──────────────────────────────────── */}
        {activeTab === 'tests' && (
          <View style={styles.section}>
            {/* Log form */}
            <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('exam_prep.add_mock_test')}
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('exam_prep.subject_optional')}
              </Text>
              <RNTextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder={t('exam_prep.subject_optional')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={testSubject}
                onChangeText={setTestSubject}
              />

              <View style={styles.scoreRow}>
                <View style={styles.scoreField}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('exam_prep.score')}
                  </Text>
                  <RNTextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.onSurface,
                        borderColor: theme.colors.outline,
                      },
                    ]}
                    placeholder="e.g. 120"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="number-pad"
                    value={testScore}
                    onChangeText={setTestScore}
                  />
                </View>
                <Text style={[styles.scoreSep, { color: theme.colors.onSurfaceVariant }]}>/</Text>
                <View style={styles.scoreField}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('exam_prep.total_marks')}
                  </Text>
                  <RNTextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.onSurface,
                        borderColor: theme.colors.outline,
                      },
                    ]}
                    placeholder="e.g. 200"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="number-pad"
                    value={testTotal}
                    onChangeText={setTestTotal}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogTest}
                disabled={savingTest || !testScore.trim() || !testTotal.trim()}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor:
                      savingTest || !testScore.trim() || !testTotal.trim()
                        ? theme.colors.surfaceVariant
                        : theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      savingTest || !testScore.trim() || !testTotal.trim()
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onPrimary,
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  {savingTest ? t('common.loading') : t('exam_prep.add_test_btn')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Score trend */}
            {mockTests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginTop: 16 }]}>
                  {t('exam_prep.test_history')}
                </Text>

                {/* Simple bar chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.chartLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('exam_prep.score_trend')} (%)
                  </Text>
                  <View style={styles.bars}>
                    {[...mockTests].reverse().slice(-10).map((test) => {
                      const pct = Math.round((test.score / test.total_marks) * 100);
                      return (
                        <View key={test.id} style={styles.barWrapper}>
                          <Text style={[styles.barPct, { color: theme.colors.primary }]}>
                            {pct}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${pct}%` as any,
                                  backgroundColor:
                                    pct >= 75
                                      ? '#2E7D32'
                                      : pct >= 50
                                      ? theme.colors.primary
                                      : '#C62828',
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.barDate, { color: theme.colors.onSurfaceVariant }]}>
                            {test.test_date.slice(5)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* List */}
                {mockTests.map((test) => {
                  const pct = Math.round((test.score / test.total_marks) * 100);
                  return (
                    <View
                      key={test.id}
                      style={[styles.logRow, { backgroundColor: theme.colors.surface }]}
                    >
                      <View style={styles.logLeft}>
                        <Text style={[styles.logSubject, { color: theme.colors.onSurface }]} numberOfLines={1}>
                          {test.subject || t('exam_prep.full_mock')}
                        </Text>
                        <Text style={[styles.logDate, { color: theme.colors.onSurfaceVariant }]}>
                          {test.test_date}
                        </Text>
                      </View>
                      <View style={styles.logRight}>
                        <Text style={[styles.logHours, { color: pct >= 75 ? '#2E7D32' : pct >= 50 ? theme.colors.primary : '#C62828' }]}>
                          {test.score}/{test.total_marks}
                        </Text>
                        <Text style={[styles.logDate, { color: theme.colors.onSurfaceVariant }]}>
                          {pct}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={2500}
      >
        {toast ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  statsStrip: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  // Subject card
  subjectCard: { borderRadius: 14, padding: 14, gap: 8 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '600', marginRight: 8 },
  subjectPct: { fontSize: 15, fontWeight: '800' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  subjectBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  deltaBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  // Form
  formCard: { borderRadius: 16, padding: 16, gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  chipScroll: { marginBottom: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  diffRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  diffBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  // Log rows
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  logLeft: { flex: 1, gap: 2 },
  logRight: { alignItems: 'flex-end', gap: 4 },
  logSubject: { fontSize: 14, fontWeight: '600' },
  logDate: { fontSize: 12 },
  logHours: { fontSize: 16, fontWeight: '800' },
  diffPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  // Score chart
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 8 },
  chartLabel: { fontSize: 12, marginBottom: 10 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 2 },
  barPct: { fontSize: 9, fontWeight: '700' },
  barTrack: { flex: 1, width: '100%', backgroundColor: '#F5F5F5', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barDate: { fontSize: 8 },
  // Score row
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreField: { flex: 1 },
  scoreSep: { fontSize: 24, fontWeight: '300', marginTop: 20 },
});
