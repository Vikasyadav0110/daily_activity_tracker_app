import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export interface BarItem {
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

interface Props {
  data: BarItem[];
  maxValue?: number;
  unit?: string;
  height?: number;
}

export function HorizontalBarChart({ data, maxValue, unit = '', height = 20 }: Props) {
  const theme = useTheme();
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      {data.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text
            style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.max(2, (item.value / max) * 100)}%`,
                  backgroundColor: item.color ?? theme.colors.primary,
                  height,
                },
              ]}
            />
          </View>
          <Text style={[styles.value, { color: theme.colors.onSurface }]}>
            {item.value}{unit}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 80, fontSize: 12, fontWeight: '500' },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: { borderRadius: 6 },
  value: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});
