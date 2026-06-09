import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { CoachMessage } from '@services/ai/coachService';

interface Props {
  message: CoachMessage;
  onDismiss?: (id: string) => void;
  onAct?: (id: string) => void;
}

const TYPE_ICONS = {
  miss_streak: '🔔',
  plan_recalibration: '🔄',
  encouragement: '💪',
};

const PHASE3_COLOR = '#6A1B9A';

export function CoachNudgeCard({ message, onDismiss, onAct }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const icon = TYPE_ICONS[message.message_type];

  return (
    <Surface
      style={[styles.card, { backgroundColor: PHASE3_COLOR + '10', borderColor: PHASE3_COLOR + '30', borderWidth: 1 }]}
      elevation={0}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.type, { color: PHASE3_COLOR }]}>
          {t(`coaching.${message.message_type}`)}
        </Text>
      </View>
      <Text style={[styles.text, { color: theme.colors.onSurface }]}>{message.message_text}</Text>
      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity
            style={[styles.dismissBtn, { borderColor: theme.colors.outline }]}
            onPress={() => onDismiss(message.id)}
          >
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>{t('common.dismiss')}</Text>
          </TouchableOpacity>
        )}
        {onAct && (
          <TouchableOpacity
            style={[styles.actBtn, { backgroundColor: PHASE3_COLOR }]}
            onPress={() => onAct(message.id)}
          >
            <Text style={styles.actBtnText}>📝 {t('coaching.log_now')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 20 },
  type: { fontSize: 12, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dismissBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actBtn: { flex: 2, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
});
