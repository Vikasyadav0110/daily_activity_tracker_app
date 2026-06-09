import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { MoodLog } from '@services/db/moodRepo';

interface Props {
  logs: MoodLog[];
}

const CHART_HEIGHT = 80;
const BAR_WIDTH = 18;
const MOOD_COLORS = ['#EF5350', '#FF7043', '#FFC107', '#66BB6A', '#26A69A'];

export function MoodChart({ logs }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, textAlign: 'center' }}>
          {t('wellness.no_mood_data')}
        </Text>
      </View>
    );
  }

  // Show last 30 days
  const display = logs.slice(-30);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        {t('wellness.mood_30d')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {display.map((log, idx) => {
            const barH = (log.mood_rating / 5) * CHART_HEIGHT;
            const color = MOOD_COLORS[log.mood_rating - 1];
            return (
              <View key={`${log.date}-${idx}`} style={styles.barWrapper}>
                <View style={[styles.barBg, { height: CHART_HEIGHT, backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.bar,
                      { height: barH, backgroundColor: color },
                    ]}
                  />
                </View>
                {idx % 7 === 0 && (
                  <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {formatDay(log.date)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {['😞', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MOOD_COLORS[i] }]} />
            <Text style={styles.legendEmoji}>{emoji}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  empty: { borderRadius: 12, padding: 20, alignItems: 'center' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingBottom: 16 },
  barWrapper: { alignItems: 'center', gap: 4 },
  barBg: { width: BAR_WIDTH, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: BAR_WIDTH, borderRadius: 4 },
  dateLabel: { fontSize: 8, textAlign: 'center', width: BAR_WIDTH + 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendEmoji: { fontSize: 12 },
});
