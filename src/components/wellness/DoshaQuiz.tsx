import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@store/settingsStore';
import { DOSHA_QUIZ, calculateDosha, type Dosha } from '@services/wellness/ayurvedaService';
import { saveDoshaProfile } from '@services/db/wellnessRepo';

interface Props {
  onComplete?: (primary: Dosha, secondary: Dosha | null) => void;
}

const DOSHA_COLORS: Record<Dosha, string> = {
  vata: '#5C6BC0',
  pitta: '#EF5350',
  kapha: '#26A69A',
};

const DOSHA_ICONS: Record<Dosha, string> = {
  vata: '🌬️',
  pitta: '🔥',
  kapha: '🌊',
};

const DOSHA_DESCRIPTIONS: Record<Dosha, string> = {
  vata: 'Creative, quick, light — fuelled by air and space. Tends toward dryness and anxiety when imbalanced.',
  pitta: 'Sharp, intelligent, intense — fuelled by fire. Tends toward irritability and inflammation when imbalanced.',
  kapha: 'Steady, nurturing, strong — fuelled by earth and water. Tends toward sluggishness when imbalanced.',
};

export function DoshaQuiz({ onComplete }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const [step, setStep] = useState(0); // -1 = result
  const [answers, setAnswers] = useState<Dosha[]>([]);
  const [result, setResult] = useState<{ primary: Dosha; secondary: Dosha | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const question = DOSHA_QUIZ[step];

  function handleAnswer(dosha: Dosha) {
    const newAnswers = [...answers, dosha];
    if (step < DOSHA_QUIZ.length - 1) {
      setAnswers(newAnswers);
      setStep((s) => s + 1);
    } else {
      const res = calculateDosha(newAnswers);
      setResult(res);
      setStep(-1);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await saveDoshaProfile(result.primary, result.secondary);
      onComplete?.(result.primary, result.secondary);
    } finally {
      setSaving(false);
    }
  }

  function handleRetake() {
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  if (step === -1 && result) {
    const color = DOSHA_COLORS[result.primary];
    return (
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text style={styles.resultEmoji}>{DOSHA_ICONS[result.primary]}</Text>
        <Text style={[styles.resultTitle, { color }]}>
          {result.primary.charAt(0).toUpperCase() + result.primary.slice(1)} Prakriti
        </Text>
        {result.secondary && (
          <Text style={[styles.secondary, { color: DOSHA_COLORS[result.secondary] }]}>
            {t('wellness.secondary')}: {result.secondary.charAt(0).toUpperCase() + result.secondary.slice(1)}
          </Text>
        )}
        <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
          {DOSHA_DESCRIPTIONS[result.primary]}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.retakeBtn, { borderColor: theme.colors.outline }]} onPress={handleRetake}>
            <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{t('wellness.retake')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: color }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size={16} color="white" />
              : <Text style={styles.saveBtnText}>{t('wellness.save_dosha')}</Text>
            }
          </TouchableOpacity>
        </View>
      </Surface>
    );
  }

  const progress = (step / DOSHA_QUIZ.length) * 100;
  const q = language === 'hi' ? question.questionHi : question.question;

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={[styles.stepText, { color: theme.colors.onSurfaceVariant }]}>
          {step + 1} / {DOSHA_QUIZ.length}
        </Text>
        <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as `${number}%`, backgroundColor: '#6A1B9A' }]} />
        </View>
      </View>

      <Text style={[styles.question, { color: theme.colors.onSurface }]}>{q}</Text>

      <View style={styles.options}>
        {question.options.map((opt, i) => {
          const color = DOSHA_COLORS[opt.dosha];
          const label = language === 'hi' ? opt.labelHi : opt.label;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, { borderColor: color + '60', backgroundColor: color + '10' }]}
              onPress={() => handleAnswer(opt.dosha)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{DOSHA_ICONS[opt.dosha]}</Text>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, gap: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepText: { fontSize: 12, fontWeight: '600', minWidth: 40 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  question: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  optionIcon: { fontSize: 22 },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  // Result
  resultEmoji: { fontSize: 56, textAlign: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  secondary: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  desc: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  retakeBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
