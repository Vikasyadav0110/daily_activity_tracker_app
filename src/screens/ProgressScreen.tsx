import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { getActivities } from '@services/db/activitiesRepo';
import { getAllStreaks } from '@services/db/streaksRepo';
import { getLogsForActivity, getLogsForRange } from '@services/db/logsRepo';
import { getEarnedBadges } from '@services/db/badgesRepo';
import { isStreakAtRisk } from '@utils/streakCalculator';
import { getTodayIST, addDays } from '@utils/dateUtils';
import { StreakCard } from '@components/progress/StreakCard';
import { CalendarHeatmap } from '@components/progress/CalendarHeatmap';
import type { Activity } from '@services/db/activitiesRepo';
import type { Streak } from '@services/db/streaksRepo';
import type { Badge } from '@services/db/badgesRepo';

interface ActivityWithStreak {
  activity: Activity;
  streak: Streak | null;
}

interface Stats {
  totalLogged: number;
  thisWeek: number;
  bestStreak: number;
}

export function ProgressScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [activitiesWithStreaks, setActivitiesWithStreaks] = useState<ActivityWithStreak[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [heatmapDates, setHeatmapDates] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ totalLogged: 0, thisWeek: 0, bestStreak: 0 });
  const today = getTodayIST();
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const loadData = useCallback(async () => {
    try {
      const [activities, allStreaks, badges] = await Promise.all([
        getActivities({ archived: false }),
        getAllStreaks(),
        getEarnedBadges(),
      ]);

      const streakMap = new Map(allStreaks.map((s) => [s.activity_id, s]));

      const pairs: ActivityWithStreak[] = activities.map((a) => ({
        activity: a,
        streak: streakMap.get(a.id) ?? null,
      }));

      // Sort: at-risk first, then by current streak desc
      pairs.sort((a, b) => {
        const aRisk = a.streak ? isStreakAtRisk(a.streak, today) : false;
        const bRisk = b.streak ? isStreakAtRisk(b.streak, today) : false;
        if (aRisk && !bRisk) return -1;
        if (!aRisk && bRisk) return 1;
        return (b.streak?.current_streak_days ?? 0) - (a.streak?.current_streak_days ?? 0);
      });

      setActivitiesWithStreaks(pairs);
      setEarnedBadges(badges);

      // Compute stats — single query covers all-time; week is a subset
      const weekStart = addDays(today, -6);
      const allTimeLogs = await getLogsForRange('2020-01-01', today);
      const bestStreak = Math.max(0, ...allStreaks.map((s) => s.longest_streak_days));

      setStats({
        totalLogged: allTimeLogs.filter((l) => l.status === 'completed').length,
        thisWeek: allTimeLogs.filter((l) => l.status === 'completed' && l.log_date >= weekStart).length,
        bestStreak,
      });

      // Default: select first activity for heatmap
      if (pairs.length > 0 && selectedActivityId === null) {
        setSelectedActivityId(pairs[0].activity.id);
      }
    } catch {
      // ignore — show empty state
    } finally {
      setLoading(false);
    }
  }, [today, selectedActivityId]);

  useEffect(() => {
    loadData();
  }, []);

  // Load heatmap dates when selected activity changes
  useEffect(() => {
    if (selectedActivityId === null) return;
    getLogsForActivity(selectedActivityId, 365).then((logs) => {
      setHeatmapDates(
        logs.filter((l) => l.status === 'completed').map((l) => l.log_date)
      );
    });
  }, [selectedActivityId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.pageTitle, { color: theme.colors.onBackground }]}>
          {t('progress.title')}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.thisWeek}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('progress.this_week')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.totalLogged}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('progress.total_logged')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: '#FF6F00' }]}>
              {stats.bestStreak}🔥
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('progress.best_streak')}
            </Text>
          </View>
        </View>

        {/* Streaks section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          {t('progress.streak_title')}
        </Text>

        {activitiesWithStreaks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {t('progress.no_streaks')}
            </Text>
          </View>
        ) : (
          activitiesWithStreaks.map(({ activity, streak }) => (
            <StreakCard
              key={activity.id}
              activityName={activity.name}
              activityIcon={activity.icon}
              currentStreak={streak?.current_streak_days ?? 0}
              longestStreak={streak?.longest_streak_days ?? 0}
              isAtRisk={streak ? isStreakAtRisk(streak, today) : false}
            />
          ))
        )}

        {/* Calendar Heatmap */}
        {activitiesWithStreaks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              {t('progress.heatmap_title')}
            </Text>

            {/* Activity selector tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
              contentContainerStyle={styles.tabContainer}
            >
              {activitiesWithStreaks.map(({ activity }) => {
                const isSelected = selectedActivityId === activity.id;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    onPress={() => setSelectedActivityId(activity.id)}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text style={styles.tabIcon}>{activity.icon}</Text>
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isSelected
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {activity.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.heatmapCard, { backgroundColor: theme.colors.surface }]}>
              <CalendarHeatmap logDates={heatmapDates} month={currentMonth} />
            </View>
          </>
        )}

        {/* Badges earned */}
        {earnedBadges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                {t('badges.title')} ({earnedBadges.length})
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('BadgesModal')}>
                <Text style={[styles.viewAll, { color: theme.colors.primary }]}>
                  {t('badges.view_all')}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={earnedBadges}
              keyExtractor={(b) => b.badge_key}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.badgeRow}
              renderItem={({ item }) => (
                <View
                  style={[styles.badgeCard, { backgroundColor: theme.colors.surface }]}
                >
                  <Text style={styles.badgeIcon}>{item.badge_icon}</Text>
                  <Text
                    style={[styles.badgeName, { color: theme.colors.onSurface }]}
                    numberOfLines={2}
                  >
                    {item.badge_name}
                  </Text>
                </View>
              )}
            />
          </>
        )}

        {activitiesWithStreaks.length === 0 && earnedBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {t('progress.no_data')}
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  viewAll: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  emptyCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 8 },
  // Heatmap
  tabScroll: { marginBottom: 10 },
  tabContainer: { gap: 8, paddingRight: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 150,
  },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 13 },
  heatmapCard: { borderRadius: 16, padding: 16, marginBottom: 8 },
  // Badges
  badgeRow: { gap: 10, marginBottom: 10 },
  badgeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    minHeight: 90,
    justifyContent: 'center',
  },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  // Empty
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
