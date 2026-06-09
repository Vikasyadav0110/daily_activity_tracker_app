import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, RootNavigationProp } from '@navigation/types';
import {
  getHabitPrograms, getCoachPersonas, enrollInProgram,
  type HabitProgram, type CoachPersona,
} from '@services/ai/coachingService';
import { useProStore } from '@store/proStore';

type RouteProps = RouteProp<RootStackParamList, 'ProgramDetail'>;

const CATEGORY_COLORS: Record<string, string> = {
  fitness:      '#1565C0',
  mindfulness:  '#2E7D32',
  productivity: '#6A1B9A',
  spiritual:    '#E65100',
  custom:       '#BF360C',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     '🌱 Beginner',
  intermediate: '🔥 Intermediate',
  advanced:     '⚡ Advanced',
};

export default function ProgramDetailScreen() {
  const theme = useTheme() as MD3Theme;
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<RootNavigationProp>();
  const { programId } = route.params;
  const isPremiumPlus = useProStore((s) => s.isPremiumPlus);

  const [program, setProgram] = useState<HabitProgram | null>(null);
  const [persona, setPersona] = useState<CoachPersona | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    Promise.all([getHabitPrograms(), getCoachPersonas()]).then(([programs, personas]) => {
      const p = programs.find((x) => x.id === programId) ?? null;
      setProgram(p);
      if (p?.persona_id) {
        setPersona(personas.find((x) => x.id === p.persona_id) ?? null);
      }
    });
  }, [programId]);

  const handleEnroll = useCallback(async () => {
    if (!program) return;
    if (program.is_premium && !isPremiumPlus) {
      Alert.alert(
        'Premium+ Required',
        'This program is available on Premium+ plans.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
        ],
      );
      return;
    }
    setEnrolling(true);
    try {
      const userProgram = await enrollInProgram(program.id);
      navigation.replace('ProgramEnrollment', {
        programId: program.id,
        userProgramId: userProgram.id,
      });
    } catch (err) {
      Alert.alert('Enrolment Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setEnrolling(false);
    }
  }, [program, isPremiumPlus, navigation]);

  const s = styles(theme);

  if (!program) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  const accentColor = CATEGORY_COLORS[program.category] ?? '#1565C0';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Hero */}
      <View style={[s.hero, { backgroundColor: accentColor + '18' }]}>
        <Text style={s.heroEmoji}>{persona?.avatar_emoji ?? '📋'}</Text>
        <Text style={[s.heroTitle, { color: accentColor }]}>{program.title}</Text>
        <Text style={s.heroMeta}>
          {DIFFICULTY_LABELS[program.difficulty] ?? program.difficulty}
          {'  ·  '}
          {program.duration_days} days
          {'  ·  '}
          {program.category}
        </Text>
      </View>

      {/* Description */}
      <Text style={s.description}>{program.description}</Text>

      {/* Coach card */}
      {persona && (
        <View style={[s.coachCard, { borderColor: persona.color + '40' }]}>
          <Text style={s.coachEmoji}>{persona.avatar_emoji}</Text>
          <View style={s.coachBody}>
            <Text style={[s.coachName, { color: persona.color }]}>Guided by {persona.name}</Text>
            <Text style={s.coachTagline}>{persona.tagline}</Text>
          </View>
        </View>
      )}

      {/* What you'll do */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>What you'll do</Text>
        {[
          'Complete 1-3 focused tasks each day',
          'Receive coaching nudges when you fall behind',
          'Track your progress with daily reflections',
          `Finish in ${program.duration_days} days with a completion report`,
        ].map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={[s.bullet, { color: accentColor }]}>✓</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Enroll CTA */}
      <TouchableOpacity
        onPress={handleEnroll}
        disabled={enrolling}
        style={[s.enrollButton, { backgroundColor: accentColor }]}
      >
        {enrolling
          ? <ActivityIndicator color="#fff" />
          : (
            <>
              <Text style={s.enrollText}>Start {program.duration_days}-Day Program</Text>
              {program.is_premium && !isPremiumPlus && (
                <Text style={s.enrollSub}>Premium+ required</Text>
              )}
            </>
          )
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (theme: MD3Theme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.colors.background },
  content:      { padding: 20, paddingBottom: 40 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero:         { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  heroEmoji:    { fontSize: 48, marginBottom: 12 },
  heroTitle:    { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  heroMeta:     { fontSize: 13, color: '#666', textAlign: 'center' },
  description:  { fontSize: 15, color: theme.colors.onSurface, lineHeight: 22, marginBottom: 20 },
  coachCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1.5,
    backgroundColor: theme.colors.surface, marginBottom: 20,
  },
  coachEmoji:   { fontSize: 28 },
  coachBody:    { flex: 1 },
  coachName:    { fontSize: 15, fontWeight: '700' },
  coachTagline: { fontSize: 13, color: theme.colors.onSurfaceVariant },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.onBackground, marginBottom: 12 },
  bulletRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 },
  bullet:       { fontSize: 16, fontWeight: '700', width: 20 },
  bulletText:   { flex: 1, fontSize: 14, color: theme.colors.onSurface, lineHeight: 20 },
  enrollButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  enrollText:   { color: '#fff', fontSize: 17, fontWeight: '700' },
  enrollSub:    { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
