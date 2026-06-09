import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@store/settingsStore';
import type { VratDate } from '@services/spiritual/vratService';

interface Props {
  vrats: VratDate[];
  onLogFast?: (vrat: VratDate) => void;
}

const TYPE_COLORS: Record<VratDate['type'], string> = {
  ekadashi: '#6A1B9A',
  festival: '#E65100',
  fasting: '#1565C0',
};

const TYPE_ICONS: Record<VratDate['type'], string> = {
  ekadashi: '🕉️',
  festival: '🎊',
  fasting: '🌙',
};

export function VratCalendar({ vrats, onLogFast }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  if (vrats.length === 0) {
    return (
      <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          {t('spiritual.no_upcoming_vrats')}
        </Text>
      </Surface>
    );
  }

  return (
    <FlatList
      data={vrats}
      keyExtractor={(item) => item.date}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const color = TYPE_COLORS[item.type];
        const icon = TYPE_ICONS[item.type];
        const name = language === 'hi' ? item.nameHi : item.name;
        const daysUntil = getDaysUntil(item.date);

        return (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.row}>
              <View style={[styles.dateBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.dateDay, { color }]}>{formatDay(item.date)}</Text>
                <Text style={[styles.dateMonth, { color }]}>{formatMonth(item.date)}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.typeIcon}>{icon}</Text>
                  <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
                <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                  {item.description}
                </Text>
                {daysUntil <= 3 && daysUntil >= 0 && (
                  <Text style={[styles.soon, { color }]}>
                    {daysUntil === 0 ? t('spiritual.today') : `${t('spiritual.in')} ${daysUntil} ${t('spiritual.days')}`}
                  </Text>
                )}
              </View>
              {onLogFast && item.type !== 'festival' && (
                <TouchableOpacity
                  style={[styles.logBtn, { borderColor: color }]}
                  onPress={() => onLogFast(item)}
                >
                  <Text style={[styles.logBtnText, { color }]}>{t('spiritual.log')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Surface>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString().padStart(2, '0');
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short' });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  empty: { borderRadius: 14, padding: 20, alignItems: 'center' },
  card: { borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateBadge: { width: 48, borderRadius: 10, padding: 8, alignItems: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '600' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeIcon: { fontSize: 16 },
  name: { fontSize: 14, fontWeight: '700', flex: 1 },
  desc: { fontSize: 12, lineHeight: 17 },
  soon: { fontSize: 11, fontWeight: '700' },
  logBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  logBtnText: { fontSize: 12, fontWeight: '700' },
});
