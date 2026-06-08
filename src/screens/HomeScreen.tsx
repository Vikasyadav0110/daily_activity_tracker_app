import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Text, FAB, Snackbar, ProgressBar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useActivitiesStore } from '@store/activitiesStore';
import { useSettingsStore } from '@store/settingsStore';
import { getTodaysActivities } from '@services/db/activitiesRepo';
import { getTodaysLogs, deleteLog } from '@services/db/logsRepo';
import { ActivityListItem } from '@components/activities/ActivityListItem';
import { ActivityCreationModal } from '@components/activities/ActivityCreationModal';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { getTodayIST, getGreeting } from '@utils/dateUtils';
import type { Activity } from '@services/db/activitiesRepo';
import type { LogStatus } from '@services/db/logsRepo';

export function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const {
    activities,
    setActivities,
    setTodayLogs,
    optimisticUndo,
    confirmUndo,
    isCheckedOff,
  } = useActivitiesStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [undoSnackVisible, setUndoSnackVisible] = useState(false);
  const [undoActivityId, setUndoActivityId] = useState<number | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [acts, logs] = await Promise.all([
        getTodaysActivities(),
        getTodaysLogs(),
      ]);
      setActivities(acts);
      const logMap: Record<number, LogStatus> = {};
      for (const log of logs) {
        logMap[log.activity_id] = log.status as LogStatus;
      }
      setTodayLogs(logMap);
    } catch (e) {
      // SQLite errors surface here — show nothing, don't crash
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setActivities, setTodayLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUndoRequest = useCallback((activityId: number) => {
    setUndoActivityId(activityId);
    setUndoSnackVisible(true);
    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => {
      setUndoSnackVisible(false);
      setUndoActivityId(null);
    }, 5000);
    setUndoTimer(timer);
  }, [undoTimer]);

  const handleUndo = useCallback(async () => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoSnackVisible(false);
    if (undoActivityId == null) return;
    optimisticUndo(undoActivityId);
    try {
      await deleteLog(undoActivityId, getTodayIST());
      confirmUndo(undoActivityId);
    } catch {
      // If delete fails, reload from DB to restore consistent state
      await loadData();
    }
    setUndoActivityId(null);
  }, [undoActivityId, undoTimer, optimisticUndo, confirmUndo, loadData]);

  const completedCount = activities.filter((a) => isCheckedOff(a.id)).length;
  const totalCount = activities.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const greeting = getGreeting();
  const greetingKey = `home.good_${greeting}` as const;

  const renderItem = ({ item }: { item: Activity }) => (
    <ActivityListItem
      activity={item}
      onUndoRequest={handleUndoRequest}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
        {t('home.empty_title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {t('home.empty_subtitle')}
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
          {t(greetingKey)}
        </Text>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('home.title')}
        </Text>
        {totalCount > 0 && (
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
              {t('home.progress', { completed: completedCount, total: totalCount })}
            </Text>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        )}
      </View>

      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          activities.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[theme.colors.primary]}
          />
        }
        getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
        removeClippedSubviews
      />

      <FAB
        icon="plus"
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        testID="add-activity-fab"
        accessibilityLabel={t('home.empty_subtitle')}
      />

      <ActivityCreationModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
      />

      <Snackbar
        visible={undoSnackVisible}
        onDismiss={() => setUndoSnackVisible(false)}
        duration={5000}
        action={{ label: t('activities.check_off.undo'), onPress: handleUndo }}
      >
        {t('activities.check_off.completed_today')}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  progressSection: { gap: 6 },
  progressText: { fontSize: 13 },
  progressBar: { height: 6, borderRadius: 3 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  listEmpty: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 18 },
});
