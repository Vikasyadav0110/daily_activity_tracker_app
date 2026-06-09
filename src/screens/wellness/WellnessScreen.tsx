import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useProStore } from '@store/proStore';
import { PremiumPlusGate } from '@components/common/PremiumPlusGate';
import { MoodCheckIn } from '@components/mood/MoodCheckIn';
import { MoodChart } from '@components/mood/MoodChart';
import { CorrelationCard } from '@components/mood/CorrelationCard';
import { VratCalendar } from '@components/spiritual/VratCalendar';
import { MantraCounter } from '@components/spiritual/MantraCounter';
import { TipCard } from '@components/wellness/TipCard';
import { DoshaQuiz } from '@components/wellness/DoshaQuiz';
import { CoachNudgeCard } from '@components/coaching/CoachNudgeCard';
import {
  getMoodForDate,
  getMoodHistory,
  getMoodActivityCorrelations,
  type MoodLog,
  type ActivityMoodCorrelation,
} from '@services/db/moodRepo';
import { getUpcomingVrats, type VratDate } from '@services/spiritual/vratService';
import { getDailyTip, type WellnessTip } from '@services/wellness/ayurvedaService';
import {
  fetchCoachNudge,
  getPendingNudges,
  openNudge,
  actOnNudge,
  type CoachMessage,
} from '@services/ai/coachService';
import { getTodayIST } from '@utils/dateUtils';
import { getDoshaProfile, type DoshaProfile } from '@services/db/wellnessRepo';

const PHASE3_COLOR = '#6A1B9A';

type Section = 'mood' | 'spiritual' | 'wellness' | 'coaching';

export function WellnessScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isPremiumPlus = useProStore((s) => s.isPremiumPlus);

  const [activeSection, setActiveSection] = useState<Section>('mood');
  const [showDoshaQuiz, setShowDoshaQuiz] = useState(false);

  // Mood state
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [todayEnergy, setTodayEnergy] = useState<number | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [correlations, setCorrelations] = useState<ActivityMoodCorrelation[]>([]);

  // Spiritual state
  const [upcomingVrats, setUpcomingVrats] = useState<VratDate[]>([]);

  // Wellness state
  const [dailyTip, setDailyTip] = useState<WellnessTip | null>(null);
  const [doshaProfile, setDoshaProfile] = useState<DoshaProfile | null>(null);

  // Coaching state
  const [nudges, setNudges] = useState<CoachMessage[]>([]);
  const [loadingNudge, setLoadingNudge] = useState(false);

  const loadData = useCallback(async () => {
    const today = getTodayIST();

    // Mood
    const moodEntry = await getMoodForDate(today).catch(() => null);
    if (moodEntry) {
      setTodayMood(moodEntry.mood_rating);
      setTodayEnergy(moodEntry.energy_level);
    }
    const history = await getMoodHistory(30).catch(() => []);
    setMoodHistory(history);
    const corr = await getMoodActivityCorrelations(30).catch(() => []);
    setCorrelations(corr);

    // Spiritual
    const vrats = getUpcomingVrats(30);
    setUpcomingVrats(vrats);

    // Wellness
    const profile = await getDoshaProfile().catch(() => null);
    setDoshaProfile(profile);
    const tip = getDailyTip(today, profile?.primary_dosha ?? undefined);
    setDailyTip(tip);

    // Coaching nudges (local cache)
    const pending = await getPendingNudges().catch(() => []);
    setNudges(pending);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFetchNudge() {
    if (!isPremiumPlus) return;
    setLoadingNudge(true);
    try {
      const nudge = await fetchCoachNudge();
      if (nudge) {
        const pending = await getPendingNudges().catch(() => []);
        setNudges(pending);
      } else {
        Alert.alert(t('coaching.no_nudge_title'), t('coaching.no_nudge_body'));
      }
    } finally {
      setLoadingNudge(false);
    }
  }

  async function handleDismissNudge(id: string) {
    await openNudge(id);
    setNudges((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleActNudge(id: string) {
    await actOnNudge(id);
    setNudges((prev) => prev.filter((n) => n.id !== id));
    navigation.navigate('Main');
  }

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: 'mood', label: t('wellness.mood'), icon: '💚' },
    { key: 'spiritual', label: t('wellness.spiritual'), icon: '🕉️' },
    { key: 'wellness', label: t('wellness.ayurveda'), icon: '🌿' },
    { key: 'coaching', label: t('wellness.coaching'), icon: '🤖' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {t('wellness.title')}
        </Text>
        <TouchableOpacity
          style={[styles.insightsBtn, { backgroundColor: PHASE3_COLOR }]}
          onPress={() => navigation.navigate('Insights')}
        >
          <Text style={styles.insightsBtnText}>✨ {t('wellness.ai_insights')}</Text>
        </TouchableOpacity>
      </View>

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeSection === s.key ? PHASE3_COLOR : theme.colors.surface,
                borderColor: activeSection === s.key ? PHASE3_COLOR : theme.colors.outline,
              },
            ]}
            onPress={() => setActiveSection(s.key)}
          >
            <Text style={styles.tabIcon}>{s.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: activeSection === s.key ? 'white' : theme.colors.onSurface },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* MOOD SECTION */}
        {activeSection === 'mood' && (
          <PremiumPlusGate feature={t('wellness.mood_tracking_feature')}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                💚 {t('wellness.mood_checkin_title')}
              </Text>
              <MoodCheckIn
                existingMood={todayMood}
                existingEnergy={todayEnergy}
                onSaved={loadData}
              />
              {moodHistory.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    {t('wellness.mood_history')}
                  </Text>
                  <MoodChart logs={moodHistory} />
                  <Divider style={styles.divider} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    {t('wellness.activity_correlation')}
                  </Text>
                  <CorrelationCard correlations={correlations} />
                </>
              )}
            </View>
          </PremiumPlusGate>
        )}

        {/* SPIRITUAL SECTION */}
        {activeSection === 'spiritual' && (
          <PremiumPlusGate feature={t('wellness.spiritual_feature')}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                🕉️ {t('wellness.vrat_calendar')}
              </Text>
              <VratCalendar
                vrats={upcomingVrats}
                onLogFast={() => { loadData(); }}
              />
              <Divider style={styles.divider} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                🙏 {t('wellness.mantra_counter')}
              </Text>
              <MantraCounter onSaved={() => {}} />
            </View>
          </PremiumPlusGate>
        )}

        {/* WELLNESS / AYURVEDA SECTION */}
        {activeSection === 'wellness' && (
          <View style={styles.section}>
            {/* Daily tip — available to all */}
            {dailyTip && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  🌿 {t('wellness.daily_tip')}
                </Text>
                <TipCard tip={dailyTip} />
              </>
            )}

            <Divider style={styles.divider} />

            {/* Dosha quiz — PP+ gated */}
            <PremiumPlusGate feature={t('wellness.dosha_feature')}>
              {showDoshaQuiz ? (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    🔮 {t('wellness.dosha_quiz_title')}
                  </Text>
                  <DoshaQuiz
                    onComplete={(primary) => {
                      setShowDoshaQuiz(false);
                      loadData();
                      Alert.alert(t('wellness.dosha_saved'), `${t('wellness.your_dosha')}: ${primary}`);
                    }}
                  />
                </>
              ) : (
                <Surface style={[styles.doshaCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                  <Text style={[styles.doshaLabel, { color: theme.colors.onSurface }]}>
                    {doshaProfile
                      ? `${t('wellness.your_dosha')}: ${doshaProfile.primary_dosha}${doshaProfile.secondary_dosha ? ` + ${doshaProfile.secondary_dosha}` : ''}`
                      : t('wellness.discover_dosha')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.doshaBtn, { backgroundColor: PHASE3_COLOR }]}
                    onPress={() => setShowDoshaQuiz(true)}
                  >
                    <Text style={styles.doshaBtnText}>
                      {doshaProfile ? t('wellness.retake_quiz') : t('wellness.take_quiz')}
                    </Text>
                  </TouchableOpacity>
                </Surface>
              )}
            </PremiumPlusGate>
          </View>
        )}

        {/* COACHING SECTION */}
        {activeSection === 'coaching' && (
          <PremiumPlusGate feature={t('wellness.coaching_feature')}>
            <View style={styles.section}>
              <View style={styles.coachHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  🤖 {t('wellness.ai_coach')}
                </Text>
                <TouchableOpacity
                  style={[styles.fetchBtn, { backgroundColor: PHASE3_COLOR + '20', borderColor: PHASE3_COLOR }]}
                  onPress={handleFetchNudge}
                  disabled={loadingNudge}
                >
                  {loadingNudge
                    ? <ActivityIndicator size={14} color={PHASE3_COLOR} />
                    : <Text style={[styles.fetchBtnText, { color: PHASE3_COLOR }]}>{t('wellness.check_in')}</Text>
                  }
                </TouchableOpacity>
              </View>
              {/* Smart scheduler entry */}
              <TouchableOpacity
                style={[styles.schedulerBtn, { backgroundColor: theme.colors.surface, borderColor: PHASE3_COLOR }]}
                onPress={() => navigation.navigate('SchedulePlanner')}
              >
                <Text style={styles.schedulerIcon}>📅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.schedulerTitle, { color: theme.colors.onSurface }]}>Smart Scheduler</Text>
                  <Text style={[styles.schedulerSub, { color: theme.colors.onSurfaceVariant }]}>Generate your AI daily plan</Text>
                </View>
                <Text style={[styles.schedulerArrow, { color: PHASE3_COLOR }]}>›</Text>
              </TouchableOpacity>

              {nudges.length === 0 ? (
                <Surface style={[styles.emptyNudge, { backgroundColor: theme.colors.surface }]} elevation={0}>
                  <Text style={styles.emptyNudgeEmoji}>💬</Text>
                  <Text style={[styles.emptyNudgeText, { color: theme.colors.onSurfaceVariant }]}>
                    {t('wellness.no_nudges')}
                  </Text>
                </Surface>
              ) : (
                nudges.map((nudge) => (
                  <CoachNudgeCard
                    key={nudge.id}
                    message={nudge}
                    onDismiss={handleDismissNudge}
                    onAct={handleActNudge}
                  />
                ))
              )}
            </View>
          </PremiumPlusGate>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  insightsBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  insightsBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  tabsScroll: { maxHeight: 56 },
  tabsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingBottom: 20 },
  section: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  divider: { marginVertical: 8 },
  doshaCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 12 },
  doshaLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  doshaBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  doshaBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  coachHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fetchBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  fetchBtnText: { fontSize: 12, fontWeight: '700' },
  emptyNudge: { borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
  emptyNudgeEmoji: { fontSize: 32 },
  emptyNudgeText: { fontSize: 14, textAlign: 'center' },
  schedulerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  schedulerIcon: { fontSize: 24 },
  schedulerTitle: { fontSize: 14, fontWeight: '700' },
  schedulerSub: { fontSize: 12 },
  schedulerArrow: { fontSize: 22, fontWeight: '300' },
});
