import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { GoalVsActual } from '@services/db/analyticsRepo';

interface Props {
  data: GoalVsActual[];
}

export function GoalVsActualChart({ data }: Props) {
  const theme = useTheme();
  const max = Math.max(1, ...data.flatMap((d) => [d.targetMinutes, d.avgActualMinutes]));

  if (data.length === 0) {
    return (
      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, textAlign: 'center', padding: 12 }}>
        Log activities with durations to see goal vs actual
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.primaryContainer }]} />
        <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Goal</Text>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
        <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Actual avg</Text>
      </View>

      {data.map((item) => (
        <View key={item.activityId} style={styles.row}>
          <Text style={[styles.icon]}>{item.icon}</Text>
          <View style={styles.bars}>
            {/* Goal bar */}
            <View style={styles.barRow}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(item.targetMinutes / max) * 100}%`,
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barValue, { color: theme.colors.onSurfaceVariant }]}>
                {item.targetMinutes}m
              </Text>
            </View>
            {/* Actual bar */}
            <View style={styles.barRow}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(item.avgActualMinutes / max) * 100}%`,
                      backgroundColor:
                        item.avgActualMinutes >= item.targetMinutes
                          ? '#2E7D32'
                          : theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barValue,
                  {
                    color:
                      item.avgActualMinutes >= item.targetMinutes
                        ? '#2E7D32'
                        : theme.colors.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {item.avgActualMinutes}m
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, marginRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 20, width: 28 },
  bars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: { height: 14, borderRadius: 4, minWidth: 4 },
  barValue: { width: 36, fontSize: 11, textAlign: 'right' },
});
