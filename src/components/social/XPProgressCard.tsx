import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { getLevelInfo } from '@services/xp/xpEngine';
import { useTranslation } from 'react-i18next';

interface Props {
  totalXp: number;
  weekXp: number;
}

export function XPProgressCard({ totalXp, weekXp }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { current, next, progress } = getLevelInfo(totalXp);

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}
      elevation={0}
    >
      <View style={styles.top}>
        <Text style={styles.levelIcon}>{current.icon}</Text>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelName, { color: theme.colors.onPrimaryContainer }]}>
            {t('social.level', { level: current.level })} · {current.name}
          </Text>
          <Text style={[styles.xpTotal, { color: theme.colors.onPrimaryContainer }]}>
            {totalXp.toLocaleString()} XP
          </Text>
        </View>
        <View style={[styles.weekBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.weekXP, { color: theme.colors.onPrimary }]}>
            +{weekXp}
          </Text>
          <Text style={[styles.weekLabel, { color: theme.colors.onPrimary }]}>
            {t('social.this_week')}
          </Text>
        </View>
      </View>

      {next && (
        <View style={styles.progressSection}>
          <View style={[styles.track, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.nextLevel, { color: theme.colors.onPrimaryContainer }]}>
            {next.icon} {next.name} at {next.minXp.toLocaleString()} XP
          </Text>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelIcon: { fontSize: 36 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  xpTotal: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  weekBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  weekXP: { fontSize: 15, fontWeight: '800' },
  weekLabel: { fontSize: 9, fontWeight: '600' },
  progressSection: { marginTop: 14, gap: 6 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  nextLevel: { fontSize: 11, opacity: 0.7 },
});
