import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface Props {
  activityName: string;
  activityIcon: string;
  currentStreak: number;
  longestStreak: number;
  isAtRisk?: boolean;
}

export function StreakCard({
  activityName,
  activityIcon,
  currentStreak,
  longestStreak,
  isAtRisk = false,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const streakColor = isAtRisk
    ? theme.colors.error
    : currentStreak >= 7
    ? '#FF6F00'
    : theme.colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isAtRisk ? theme.colors.error : 'transparent',
          borderWidth: isAtRisk ? 1.5 : 0,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>{activityIcon}</Text>
        <View style={styles.nameBlock}>
          <Text
            style={[styles.name, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {activityName}
          </Text>
          {isAtRisk && (
            <Text style={[styles.atRisk, { color: theme.colors.error }]}>
              ⚠️ {t('progress.streak_at_risk')}
            </Text>
          )}
        </View>
        <View style={styles.streakBlock}>
          <Text style={[styles.streakCount, { color: streakColor }]}>
            {currentStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.colors.onSurfaceVariant }]}>
            {t('progress.streak_days_label')}
          </Text>
        </View>
      </View>
      <Text style={[styles.longest, { color: theme.colors.onSurfaceVariant }]}>
        {t('progress.longest_streak', { days: longestStreak })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { fontSize: 24 },
  nameBlock: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  atRisk: { fontSize: 11, fontWeight: '500' },
  streakBlock: { alignItems: 'center', minWidth: 48 },
  streakCount: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  streakLabel: { fontSize: 10, fontWeight: '500' },
  longest: { fontSize: 12, marginLeft: 34 },
});
