import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  getWeeklyTrend,
  getCategoryBreakdown,
  getHourDistribution,
  getGoalVsActual,
  type WeeklyTrend,
  type CategoryBreakdown,
  type HourBucket,
  type GoalVsActual,
} from '@services/db/analyticsRepo';
import { exportLogsToCSV } from '@services/export/csvExport';
import { WeeklyTrendChart } from '@components/analytics/WeeklyTrendChart';
import { HorizontalBarChart } from '@components/analytics/HorizontalBarChart';
import { HourHeatmap } from '@components/analytics/HourHeatmap';
import { ProGate } from '@components/common/ProGate';
import { useProStore } from '@store/proStore';
import { GoalVsActualChart } from '@components/analytics/GoalVsActualChart';

const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#1565C0',
  study: '#2E7D32',
  spiritual: '#6A1B9A',
  health: '#00838F',
  productivity: '#E65100',
  custom: '#37474F',
};

export function AnalyticsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const isPro = useProStore((s) => s.isPro);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [hourDistribution, setHourDistribution] = useState<HourBucket[]>([]);
  const [goalVsActual, setGoalVsActual] = useState<GoalVsActual[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trend, categories, hours, goals] = await Promise.all([
        getWeeklyTrend(8),
        getCategoryBreakdown(30),
        getHourDistribution(30),
        getGoalVsActual(),
      ]);
      setWeeklyTrend(trend);
      setCategoryBreakdown(categories);
      setHourDistribution(hours);
      setGoalVsActual(goals);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportLogsToCSV(90);
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const hasAnyData =
    weeklyTrend.some((w) => w.count > 0) ||
    categoryBreakdown.length > 0 ||
    hourDistribution.some((h) => h.count > 0);

  if (!hasAnyData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('analytics.title')}
        </Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            {t('analytics.no_data')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryBars = categoryBreakdown.map((c) => ({
    label: t(`activities.categories.${c.category}`, { defaultValue: c.category }),
    value: c.completed,
    color: CATEGORY_COLORS[c.category] ?? theme.colors.primary,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('analytics.title')}
          </Text>
          <TouchableOpacity
            onPress={isPro ? handleExport : () => {}}
            disabled={exporting}
            style={[
              styles.exportBtn,
              { backgroundColor: isPro ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
            ]}
          >
            {exporting ? (
              <ActivityIndicator size={14} color={theme.colors.primary} />
            ) : (
              <Text style={[styles.exportText, { color: isPro ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                {isPro ? '↓ CSV' : '🔒 CSV'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Weekly trend */}
        <Section title={t('analytics.weekly_trend')} theme={theme}>
          <WeeklyTrendChart data={weeklyTrend} />
        </Section>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <Section title={t('analytics.category_breakdown')} subtitle={t('analytics.last_30_days')} theme={theme}>
            <HorizontalBarChart
              data={categoryBars}
              unit={` ${t('analytics.completions')}`}
            />
          </Section>
        )}

        {/* Goal vs Actual — Pro */}
        <Section title={t('analytics.goal_vs_actual')} theme={theme}>
          <ProGate blurMode featureLabel="Goal vs Actual Duration">
            <GoalVsActualChart data={goalVsActual} />
          </ProGate>
        </Section>

        {/* Time-of-day heatmap — Pro */}
        {hourDistribution.some((h) => h.count > 0) && (
          <Section title={t('analytics.time_of_day')} subtitle={t('analytics.last_30_days')} theme={theme}>
            <ProGate blurMode featureLabel="Active Time of Day Heatmap">
              <HourHeatmap data={hourDistribution} />
            </ProGate>
          </Section>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  theme,
  children,
}: {
  title: string;
  subtitle?: string;
  theme: MD3Theme;
  children: React.ReactNode;
}) {
  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700' },
  exportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  exportText: { fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 11, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
