import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { getTodayIST } from '@utils/dateUtils';

interface Props {
  logDates: string[]; // YYYY-MM-DD strings of logged days
  month: string;      // YYYY-MM, e.g. "2026-06"
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarHeatmap({ logDates, month }: Props) {
  const theme = useTheme();
  const logSet = useMemo(() => new Set(logDates), [logDates]);

  const { days, startDow } = useMemo(() => {
    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const daysInMonth = new Date(year, mon, 0).getDate();
    return { days: daysInMonth, startDow: firstDay.getDay() };
  }, [month]);

  const cells = useMemo(() => {
    const result: Array<{ date: string | null; logged: boolean }> = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      result.push({ date: null, logged: false });
    }
    const [year, mon] = month.split('-');
    for (let d = 1; d <= days; d++) {
      const dayStr = String(d).padStart(2, '0');
      const date = `${year}-${mon}-${dayStr}`;
      result.push({ date, logged: logSet.has(date) });
    }
    return result;
  }, [days, startDow, month, logSet]);

  const completionPct = days > 0
    ? Math.round((logDates.filter((d) => d.startsWith(month)).length / days) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.dayHeader, { color: theme.colors.onSurfaceVariant }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          if (!cell.date) {
            return <View key={`empty-${idx}`} style={styles.cell} />;
          }
          const isToday = cell.date === getTodayIST();
          return (
            <View key={cell.date} style={styles.cell}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: cell.logged
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: theme.colors.primary,
                    opacity: cell.logged ? 1 : 0.5,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Completion summary */}
      <View style={styles.footer}>
        <View
          style={[styles.pill, { backgroundColor: theme.colors.primaryContainer }]}
        >
          <Text style={[styles.pillText, { color: theme.colors.onPrimaryContainer }]}>
            {completionPct}% this month
          </Text>
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: { gap: 4 },
  weekRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: { fontSize: 11, fontWeight: '600' },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '600' },
});
