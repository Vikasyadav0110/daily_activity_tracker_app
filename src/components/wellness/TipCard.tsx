import React from 'react';
import { View, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useSettingsStore } from '@store/settingsStore';
import type { WellnessTip } from '@services/wellness/ayurvedaService';

interface Props {
  tip: WellnessTip;
}

const CATEGORY_COLORS = {
  ayurveda: '#6A1B9A',
  seasonal: '#E65100',
  general_wellness: '#2E7D32',
};

const CATEGORY_ICONS = {
  ayurveda: '🌿',
  seasonal: '🍃',
  general_wellness: '✨',
};

export function TipCard({ tip }: Props) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);

  const color = CATEGORY_COLORS[tip.category];
  const icon = CATEGORY_ICONS[tip.category];
  const text = language === 'hi' && tip.tipHi ? tip.tipHi : tip.tip;

  function handleShare() {
    Share.share({ message: `${icon} ${text}\n\n— Daily Activity Tracker` }).catch(() => {});
  }

  return (
    <Surface style={[styles.card, { backgroundColor: color + '10', borderColor: color + '30', borderWidth: 1 }]} elevation={0}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.badge, { color }]}>
          {tip.category === 'ayurveda' ? 'Ayurveda' : tip.category === 'seasonal' ? 'Seasonal' : 'Wellness'}
          {tip.dosha ? ` · ${tip.dosha.charAt(0).toUpperCase() + tip.dosha.slice(1)}` : ''}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={[styles.shareText, { color }]}>📤</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>{text}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 22 },
  badge: { flex: 1, fontSize: 12, fontWeight: '700' },
  shareBtn: { padding: 4 },
  shareText: { fontSize: 18 },
  tipText: { fontSize: 15, lineHeight: 23 },
});
