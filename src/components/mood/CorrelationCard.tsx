import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { ActivityMoodCorrelation } from '@services/db/moodRepo';

interface Props {
  correlations: ActivityMoodCorrelation[];
}

export function CorrelationCard({ correlations }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (correlations.length === 0) {
    return null;
  }

  const maxCorr = Math.max(...correlations.map((c) => Math.abs(c.correlation)), 0.1);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('wellness.mood_boosters')}
      </Text>
      <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t('wellness.mood_boosters_sub')}
      </Text>

      <View style={styles.list}>
        {correlations.slice(0, 5).map((c, i) => {
          const pct = Math.abs(c.correlation) / maxCorr;
          const isPositive = c.correlation >= 0;
          const barColor = isPositive ? '#2E7D32' : '#C62828';

          return (
            <View key={`${c.activity_name}-${i}`} style={styles.row}>
              <Text style={styles.icon}>{c.activity_icon}</Text>
              <View style={styles.details}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {c.activity_name}
                  </Text>
                  <Text style={[styles.delta, { color: barColor }]}>
                    {isPositive ? '+' : ''}{c.correlation.toFixed(1)} 😊
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${pct * 100}%` as `${number}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
                <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
                  {t('wellness.avg_mood_on')}: {c.avg_mood_on_days} · {c.sample_size} {t('wellness.days_tracked')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12 },
  list: { gap: 12 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  icon: { fontSize: 24, marginTop: 2 },
  details: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', flex: 1 },
  delta: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  meta: { fontSize: 11 },
});
