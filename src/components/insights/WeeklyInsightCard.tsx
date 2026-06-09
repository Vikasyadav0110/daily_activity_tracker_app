import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { AiInsight } from '@services/ai/insightService';

interface Props {
  insight: AiInsight;
  onPress?: (insight: AiInsight) => void;
  onAct?: (id: string) => void;
  compact?: boolean;
}

const PHASE3_COLOR = '#6A1B9A';

export function WeeklyInsightCard({ insight, onPress, onAct, compact = false }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const isNew = !insight.viewed_at;

  return (
    <TouchableOpacity onPress={() => onPress?.(insight)} activeOpacity={0.85}>
      <Surface
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: PHASE3_COLOR + '20' }]}>
            <Text style={[styles.badgeText, { color: PHASE3_COLOR }]}>✨ AI Review</Text>
          </View>
          {isNew && (
            <View style={[styles.newDot, { backgroundColor: PHASE3_COLOR }]} />
          )}
        </View>

        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {insight.insight_title}
        </Text>

        {!compact && (
          <Text
            style={[styles.text, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={4}
          >
            {insight.insight_text}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.week, { color: theme.colors.onSurfaceVariant }]}>
            {formatWeek(insight.insight_week_start)}
          </Text>
          {onAct && !insight.was_acted_upon && (
            <TouchableOpacity
              onPress={() => onAct(insight.id)}
              style={[styles.actBtn, { borderColor: PHASE3_COLOR }]}
            >
              <Text style={[styles.actBtnText, { color: PHASE3_COLOR }]}>
                {t('insights.act_on_it')}
              </Text>
            </TouchableOpacity>
          )}
          {!!insight.was_acted_upon && (
            <Text style={[styles.actedText, { color: PHASE3_COLOR }]}>
              +{insight.xp_reward} XP ✓
            </Text>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  newDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  text: { fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  week: { fontSize: 12 },
  actBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  actBtnText: { fontSize: 12, fontWeight: '700' },
  actedText: { fontSize: 12, fontWeight: '700' },
});
