import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { HourBucket } from '@services/db/analyticsRepo';

interface Props {
  data: HourBucket[];
}

const AM_LABELS = ['12a', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const PM_LABELS = ['12p', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export function HourHeatmap({ data }: Props) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.count));

  function getColor(count: number): string {
    if (count === 0) return theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const intensity = count / max;
    // Blend from primaryContainer to primary
    const alpha = 0.2 + intensity * 0.8;
    return `rgba(21, 101, 192, ${alpha.toFixed(2)})`;
  }

  return (
    <View>
      {/* AM row */}
      <View style={styles.rowContainer}>
        <Text style={[styles.periodLabel, { color: theme.colors.onSurfaceVariant }]}>AM</Text>
        <View style={styles.row}>
          {data.slice(0, 12).map((bucket, i) => (
            <View key={i} style={styles.cellWrapper}>
              <View style={[styles.cell, { backgroundColor: getColor(bucket.count) }]} />
              {i % 3 === 0 && (
                <Text style={[styles.hourLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {AM_LABELS[i]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
      {/* PM row */}
      <View style={styles.rowContainer}>
        <Text style={[styles.periodLabel, { color: theme.colors.onSurfaceVariant }]}>PM</Text>
        <View style={styles.row}>
          {data.slice(12, 24).map((bucket, i) => (
            <View key={i} style={styles.cellWrapper}>
              <View style={[styles.cell, { backgroundColor: getColor(bucket.count) }]} />
              {i % 3 === 0 && (
                <Text style={[styles.hourLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {PM_LABELS[i]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: theme.colors.onSurfaceVariant }]}>Less</Text>
        {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
          <View
            key={i}
            style={[styles.legendDot, { backgroundColor: getColor(Math.round(v * max)) }]}
          />
        ))}
        <Text style={[styles.legendLabel, { color: theme.colors.onSurfaceVariant }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  periodLabel: { width: 24, fontSize: 10, fontWeight: '700', paddingTop: 4 },
  row: { flex: 1, flexDirection: 'row', gap: 3 },
  cellWrapper: { flex: 1, alignItems: 'center', gap: 2 },
  cell: { width: '100%', aspectRatio: 1, borderRadius: 3 },
  hourLabel: { fontSize: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 },
  legendLabel: { fontSize: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 2 },
});
