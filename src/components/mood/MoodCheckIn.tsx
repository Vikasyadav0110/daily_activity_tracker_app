import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { saveMoodLog } from '@services/db/moodRepo';
import { getTodayIST } from '@utils/dateUtils';

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'] as const;
const ENERGY_ICONS = ['🔋', '🔋', '⚡', '⚡', '🚀'] as const;

interface Props {
  existingMood?: number | null;
  existingEnergy?: number | null;
  onSaved?: () => void;
}

export function MoodCheckIn({ existingMood, existingEnergy, onSaved }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [mood, setMood] = useState<number>(existingMood ?? 0);
  const [energy, setEnergy] = useState<number>(existingEnergy ?? 0);
  const [saving, setSaving] = useState(false);

  const alreadyLogged = !!existingMood;

  async function handleSave() {
    if (mood === 0 || energy === 0) {
      Alert.alert(t('wellness.mood_incomplete'));
      return;
    }
    setSaving(true);
    try {
      await saveMoodLog(getTodayIST(), mood, energy);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {alreadyLogged ? t('wellness.mood_today') : t('wellness.how_are_you')}
      </Text>

      {/* Mood row */}
      <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
        {t('wellness.mood')}
      </Text>
      <View style={styles.row}>
        {MOOD_EMOJIS.map((emoji, i) => {
          const val = i + 1;
          return (
            <TouchableOpacity
              key={val}
              onPress={() => !alreadyLogged && setMood(val)}
              style={[
                styles.emojiBtn,
                mood === val && { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Energy row */}
      <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
        {t('wellness.energy')}
      </Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => !alreadyLogged && setEnergy(val)}
            style={[
              styles.emojiBtn,
              energy === val && { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Text style={styles.emoji}>{ENERGY_ICONS[val - 1]}</Text>
            <Text style={[styles.energyNum, { color: theme.colors.onSurfaceVariant }]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!alreadyLogged && (
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: mood > 0 && energy > 0 ? theme.colors.primary : theme.colors.surfaceDisabled },
          ]}
          onPress={handleSave}
          disabled={saving || mood === 0 || energy === 0}
        >
          {saving
            ? <ActivityIndicator size={16} color="white" />
            : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          }
        </TouchableOpacity>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 8 },
  label: { fontSize: 16, fontWeight: '700' },
  subLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  emojiBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  emoji: { fontSize: 24 },
  energyNum: { fontSize: 10, marginTop: 2 },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
