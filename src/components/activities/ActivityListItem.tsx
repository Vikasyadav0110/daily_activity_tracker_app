import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useActivitiesStore } from '@store/activitiesStore';
import { logActivity } from '@services/db/logsRepo';
import { getStreak, upsertStreak } from '@services/db/streaksRepo';
import { unlockBadge } from '@services/db/badgesRepo';
import { calculateStreakUpdate } from '@utils/streakCalculator';
import { getTodayIST } from '@utils/dateUtils';
import { awardXP } from '@services/xp/xpEngine';
import { useXPStore } from '@store/xpStore';
import { getLogsForDate } from '@services/db/logsRepo';
import { getActivities } from '@services/db/activitiesRepo';
import type { Activity } from '@services/db/activitiesRepo';

interface Props {
  activity: Activity;
  currentStreak?: number;
  onUndoRequest: (activityId: number) => void;
  onEditRequest?: (activity: Activity) => void;
  onBadgeUnlocked?: (badgeName: string, badgeIcon: string) => void;
  onExamPress?: (activityId: number) => void;
}

export function ActivityListItem({ activity, currentStreak = 0, onUndoRequest, onEditRequest, onBadgeUnlocked, onExamPress }: Props) {
  const theme = useTheme();
  const { isCheckedOff, optimisticCheckOff, confirmCheckOff, revertCheckOff } =
    useActivitiesStore();
  const addXP = useXPStore((s) => s.addXP);

  const checked = isCheckedOff(activity.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCheckOff = useCallback(async () => {
    if (checked) {
      onUndoRequest(activity.id);
      return;
    }

    // Measure latency from tap to optimistic update (target < 100ms)
    const t0 = performance.now();

    // STEP 1: Instant optimistic update — synchronous, no await
    optimisticCheckOff(activity.id);

    const optimisticMs = performance.now() - t0;
    if (__DEV__) {
      console.log(`[CheckOff] optimistic update: ${optimisticMs.toFixed(1)}ms (id=${activity.id})`);
    }

    // Haptic + animation (fire-and-forget)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.0, duration: 80, useNativeDriver: true }),
    ]).start();

    // STEP 2: Async SQLite write
    try {
      const today = getTodayIST();
      await logActivity(activity.id, today);

      const dbWriteMs = performance.now() - t0;
      if (__DEV__) {
        console.log(`[CheckOff] DB write complete: ${dbWriteMs.toFixed(1)}ms (id=${activity.id})`);
        if (dbWriteMs > 100) {
          console.warn(`[CheckOff] ⚠️ DB write exceeded 100ms: ${dbWriteMs.toFixed(1)}ms`);
        }
      }

      const existingStreak = await getStreak(activity.id);
      if (existingStreak) {
        const prevDays = existingStreak.current_streak_days;
        const update = calculateStreakUpdate(existingStreak, today);
        await upsertStreak(activity.id, update);

        // Detect milestones crossed (handles forgiveness jumps like 2→4 crossing 3)
        const streakMilestones: Array<{ days: number; key: string; name: string; icon: string }> = [
          { days: 1,   key: 'first_checkoff', name: 'First Step',      icon: '🌱' },
          { days: 3,   key: 'streak_3',       name: '3-Day Habit',     icon: '✨' },
          { days: 7,   key: 'streak_7',       name: '7-Day Warrior',   icon: '🔥' },
          { days: 14,  key: 'streak_14',      name: '2-Week Streak',   icon: '💪' },
          { days: 30,  key: 'streak_30',      name: '30-Day Champion', icon: '🏆' },
          { days: 100, key: 'streak_100',     name: '100-Day Legend',  icon: '👑' },
        ];

        const newDays = update.current_streak_days;
        for (const milestone of streakMilestones) {
          // Fire if the streak crossed or hit this milestone in this update
          if (newDays >= milestone.days && prevDays < milestone.days) {
            const unlocked = await unlockBadge(milestone.key);
            if (unlocked?.is_earned && onBadgeUnlocked) {
              onBadgeUnlocked(milestone.name, milestone.icon);
            }
          }
        }
      }

      confirmCheckOff(activity.id);

      // Award XP non-blocking — never fails the check-off
      try {
        const streak = await getStreak(activity.id);
        const streakDays = streak?.current_streak_days ?? 0;
        const durationMet =
          activity.target_duration !== null &&
          activity.target_duration > 0;
        // Check if all activities done today (for full-day bonus)
        const [allActivities, todaysLogs] = await Promise.all([
          getActivities({ archived: false }),
          getLogsForDate(today),
        ]);
        const completedIds = new Set(
          todaysLogs.filter((l) => l.status === 'completed').map((l) => l.activity_id)
        );
        const allDone = allActivities.every((a) => completedIds.has(a.id));

        const xpResult = await awardXP(activity.id, streakDays, durationMet, allDone);
        addXP(xpResult.xpGained, xpResult.level);
      } catch {
        // XP errors never block the core flow
      }
    } catch {
      revertCheckOff(activity.id);
    }
  }, [checked, activity, optimisticCheckOff, confirmCheckOff, revertCheckOff,
      scaleAnim, onUndoRequest, onBadgeUnlocked, addXP]);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          opacity: checked ? 0.7 : 1,
        },
      ]}
      testID={`activity-item-${activity.id}`}
      onLongPress={() => onEditRequest?.(activity)}
      delayLongPress={600}
    >
      <TouchableOpacity
        onPress={handleCheckOff}
        activeOpacity={0.7}
        style={styles.checkButton}
        testID={`check-off-button-${activity.id}`}
        accessibilityLabel={checked ? `Undo ${activity.name}` : `Complete ${activity.name}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: checked ? theme.colors.primary : 'transparent',
                borderColor: checked ? theme.colors.primary : theme.colors.outline,
              },
            ]}
          >
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>{activity.icon}</Text>
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.onSurface,
                textDecorationLine: checked ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {activity.name}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
              {activity.category}
            </Text>
            {currentStreak > 0 && (
              <Text style={[styles.streakBadge, { color: currentStreak >= 7 ? '#FF6F00' : theme.colors.primary }]}>
                🔥{currentStreak}
              </Text>
            )}
          </View>
        </View>
      </View>

      {activity.category === 'study' && onExamPress && (
        <TouchableOpacity
          onPress={() => onExamPress(activity.id)}
          style={[styles.examBtn, { backgroundColor: theme.colors.secondaryContainer }]}
          accessibilityLabel="Open Exam Prep"
        >
          <Text style={{ fontSize: 16 }}>📚</Text>
        </TouchableOpacity>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  checkButton: { padding: 4 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  examBtn: { padding: 8, borderRadius: 10, marginLeft: 4 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: { fontSize: 11, fontWeight: '700' },
  icon: { fontSize: 24 },
  textBlock: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 12, textTransform: 'capitalize' },
});
