import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
} from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { saveMantraLog } from '@services/db/spiritualRepo';
import { getTodayIST } from '@utils/dateUtils';
import { MANTRA_PRESETS } from '@services/spiritual/vratService';

interface Props {
  onSaved?: () => void;
}

const PHASE3_COLOR = '#6A1B9A';

export function MantraCounter({ onSaved }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [target, setTarget] = useState<number>(MANTRA_PRESETS[0].defaultCount);
  const [count, setCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const preset = MANTRA_PRESETS[selectedPreset];
  const progress = Math.min(count / target, 1);
  const sessionElapsed = sessionStart ? Math.floor((Date.now() - sessionStart.getTime()) / 60000) : 0;

  useEffect(() => {
    if (!sessionStart && count > 0) {
      setSessionStart(new Date());
    }
  }, [count, sessionStart]);

  function handleTap() {
    setCount((c) => c + 1);
    Vibration.vibrate(30);
  }

  function handleReset() {
    Alert.alert(
      t('spiritual.reset_counter'),
      t('spiritual.reset_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('spiritual.reset'), style: 'destructive', onPress: () => { setCount(0); setSessionStart(null); } },
      ]
    );
  }

  async function handleSave() {
    if (count === 0) return;
    setSaving(true);
    try {
      await saveMantraLog(preset.name, count, getTodayIST(), sessionElapsed || null);
      setCount(0);
      setSessionStart(null);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
      {/* Preset selector */}
      <View style={styles.presetRow}>
        {MANTRA_PRESETS.slice(0, 4).map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { setSelectedPreset(i); setTarget(p.defaultCount); setCount(0); setSessionStart(null); }}
            style={[
              styles.presetBtn,
              {
                backgroundColor: selectedPreset === i
                  ? PHASE3_COLOR + '20'
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text style={styles.presetIcon}>{p.icon}</Text>
            <Text
              style={[styles.presetName, { color: selectedPreset === i ? PHASE3_COLOR : theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {p.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Counter display */}
      <View style={styles.counterArea}>
        {/* Progress ring (pure View approximation) */}
        <View style={[styles.ringBg, { borderColor: theme.colors.surfaceVariant }]}>
          <View
            style={[
              styles.ringFill,
              {
                borderColor: PHASE3_COLOR,
                borderTopColor: progress > 0.25 ? PHASE3_COLOR : 'transparent',
                borderRightColor: progress > 0.5 ? PHASE3_COLOR : 'transparent',
                borderBottomColor: progress > 0.75 ? PHASE3_COLOR : 'transparent',
              },
            ]}
          />
          <View style={styles.ringCenter}>
            <Text style={[styles.countText, { color: theme.colors.onSurface }]}>{count}</Text>
            <Text style={[styles.targetText, { color: theme.colors.onSurfaceVariant }]}>/ {target}</Text>
          </View>
        </View>

        {/* Tap button */}
        <TouchableOpacity
          style={[styles.tapBtn, { backgroundColor: PHASE3_COLOR }]}
          onPress={handleTap}
          activeOpacity={0.7}
        >
          <Text style={styles.tapIcon}>{preset.icon}</Text>
          <Text style={styles.tapText}>{t('spiritual.tap_to_count')}</Text>
        </TouchableOpacity>
      </View>

      {/* Session info */}
      {count > 0 && (
        <Text style={[styles.sessionInfo, { color: theme.colors.onSurfaceVariant }]}>
          {preset.name} · {sessionElapsed > 0 ? `${sessionElapsed} min` : t('spiritual.just_started')}
        </Text>
      )}

      {count >= target && (
        <View style={[styles.completeBanner, { backgroundColor: PHASE3_COLOR + '20' }]}>
          <Text style={[styles.completeText, { color: PHASE3_COLOR }]}>
            🙏 {target} {preset.name} {t('spiritual.completed')}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.colors.outline }]} onPress={handleReset}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
            {t('spiritual.reset')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: count > 0 ? PHASE3_COLOR : theme.colors.surfaceDisabled }]}
          onPress={handleSave}
          disabled={count === 0 || saving}
        >
          {saving
            ? <ActivityIndicator size={16} color="white" />
            : <Text style={styles.saveBtnText}>{t('spiritual.save_session')}</Text>
          }
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 14 },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, gap: 4 },
  presetIcon: { fontSize: 20 },
  presetName: { fontSize: 10, fontWeight: '600' },
  counterArea: { alignItems: 'center', gap: 16 },
  ringBg: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  ringFill: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 8 },
  ringCenter: { alignItems: 'center' },
  countText: { fontSize: 36, fontWeight: '800' },
  targetText: { fontSize: 14 },
  tapBtn: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tapIcon: { fontSize: 28 },
  tapText: { color: 'white', fontSize: 11, fontWeight: '700' },
  sessionInfo: { fontSize: 12, textAlign: 'center' },
  completeBanner: { borderRadius: 12, padding: 10, alignItems: 'center' },
  completeText: { fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  resetBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
