import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { WeeklyTrend } from '@services/db/analyticsRepo';

interface Props {
  data: WeeklyTrend[];
}

export function WeeklyTrendChart({ data }: Props) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((item, i) => {
          const pct = item.count / max;
          const isLast = i === data.length - 1;
          return (
            <View key={i} style={styles.col}>
              <Text style={[styles.countLabel, { color: theme.colors.onSurfaceVariant }]}>
                {item.count > 0 ? item.count : ''}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(4, pct * 100)}%`,
                      backgroundColor: isLast
                        ? theme.colors.primary
                        : theme.colors.primaryContainer,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.weekLabel, { color: isLast ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                {item.week}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 140 },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 20,
    paddingTop: 16,
  },
  col: { flex: 1, alignItems: 'center', height: '100%' },
  countLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  weekLabel: { fontSize: 9, fontWeight: '600', marginTop: 4 },
});
