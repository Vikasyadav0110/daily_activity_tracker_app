import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useActivitiesStore } from '@store/activitiesStore';
import { logActivity } from '@services/db/logsRepo';
import { getStreak, upsertStreak } from '@services/db/streaksRepo';
import { unlockBadge } from '@services/db/badgesRepo';
import { calculateStreakUpdate } from '@utils/streakCalculator';
import { getTodayIST } from '@utils/dateUtils';
import type { Activity } from '@services/db/activitiesRepo';

interface Props {
  activity: Activity;
  onUndoRequest: (activityId: number) => void;
}

export function ActivityListItem({ activity, onUndoRequest }: Props) {
  const theme = useTheme();
  const { isCheckedOff, optimisticCheckOff, confirmCheckOff, revertCheckOff } =
    useActivitiesStore();

  const checked = isCheckedOff(activity.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCheckOff = useCallback(async () => {
    if (checked) {
      onUndoRequest(activity.id);
      return;
    }

    // STEP 1: Instant optimistic update — this must happen synchronously before any await
    optimisticCheckOff(activity.id);

    // Haptic feedback (fire-and-forget, non-blocking)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.0, duration: 80, useNativeDriver: true }),
    ]).start();

    // STEP 2: Async SQLite write (does not block UI)
    try {
      const today = getTodayIST();
      await logActivity(activity.id, today);

      const existingStreak = await getStreak(activity.id);
      if (existingStreak) {
        const update = calculateStreakUpdate(existingStreak, today);
        await upsertStreak(activity.id, update);

        // Evaluate badge unlocks
        if (update.current_streak_days === 7)  await unlockBadge('streak_7');
        if (update.current_streak_days === 30) await unlockBadge('streak_30');
        if (update.current_streak_days === 100) await unlockBadge('streak_100');
        if (update.current_streak_days >= 1)  await unlockBadge('first_log');
      }

      confirmCheckOff(activity.id);
    } catch {
      revertCheckOff(activity.id);
    }
  }, [checked, activity.id, optimisticCheckOff, confirmCheckOff, revertCheckOff, scaleAnim, onUndoRequest]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          opacity: checked ? 0.7 : 1,
        },
      ]}
      testID={`activity-item-${activity.id}`}
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
        <Text style={[styles.icon]}>{activity.icon}</Text>
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
          <Text style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
            {activity.category}
          </Text>
        </View>
      </View>
    </View>
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
  checkButton: {
    padding: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
