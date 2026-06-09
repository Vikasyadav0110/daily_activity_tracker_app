import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { RootNavigationProp } from '@navigation/types';
import {
  getCoachPersonas, getUserPersona, setUserPersona,
  type CoachPersona,
} from '@services/ai/coachingService';
import { useProStore } from '@store/proStore';

export default function CoachPersonaSelectorScreen() {
  const theme = useTheme() as MD3Theme;
  const navigation = useNavigation<RootNavigationProp>();
  const isPremiumPlus = useProStore((s) => s.isPremiumPlus);

  const [personas, setPersonas] = useState<CoachPersona[]>([]);
  const [selectedId, setSelectedId] = useState<string>('motivator');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCoachPersonas(), getUserPersona()]).then(([p, current]) => {
      setPersonas(p);
      setSelectedId(current);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSelect = useCallback((persona: CoachPersona) => {
    if (persona.is_premium && !isPremiumPlus) {
      Alert.alert(
        'Premium+ Required',
        `${persona.name} is available on Premium+ plans. Upgrade to unlock all 5 coaches.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
        ],
      );
      return;
    }
    setSelectedId(persona.id);
  }, [isPremiumPlus, navigation]);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      await setUserPersona(selectedId);
      const persona = personas.find((p) => p.id === selectedId);
      navigation.navigate('CoachChat', { personaId: selectedId });
      if (persona) {
        Alert.alert(`${persona.avatar_emoji} Meet ${persona.name}`, persona.tagline);
      }
    } catch {
      Alert.alert('Error', 'Could not save your coach. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [selectedId, personas, navigation]);

  const s = styles(theme);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Choose Your Coach</Text>
      <Text style={s.subheading}>
        Your coach guides your daily habit journey with a personalised style.
        You can change this anytime.
      </Text>

      {personas.map((persona) => {
        const locked = persona.is_premium && !isPremiumPlus;
        const selected = selectedId === persona.id;
        return (
          <TouchableOpacity
            key={persona.id}
            onPress={() => handleSelect(persona)}
            style={[
              s.card,
              selected && { borderColor: persona.color, borderWidth: 2.5 },
              locked && s.lockedCard,
            ]}
            activeOpacity={0.75}
          >
            <View style={[s.avatarCircle, { backgroundColor: persona.color + '22' }]}>
              <Text style={s.avatarEmoji}>{persona.avatar_emoji}</Text>
            </View>
            <View style={s.cardBody}>
              <View style={s.cardHeader}>
                <Text style={[s.personaName, { color: persona.color }]}>{persona.name}</Text>
                {locked && (
                  <View style={s.premiumBadge}>
                    <Text style={s.premiumBadgeText}>Premium+</Text>
                  </View>
                )}
                {selected && !locked && (
                  <View style={[s.selectedBadge, { backgroundColor: persona.color }]}>
                    <Text style={s.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </View>
              <Text style={s.tagline}>{persona.tagline}</Text>
              <Text style={s.description} numberOfLines={2}>{persona.description}</Text>
              <View style={[s.specialtyChip, { backgroundColor: persona.color + '18' }]}>
                <Text style={[s.specialtyText, { color: persona.color }]}>{persona.specialty}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={handleConfirm}
        disabled={saving}
        style={s.confirmButton}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.confirmText}>Start Coaching with {personas.find((p) => p.id === selectedId)?.name ?? 'Coach'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (theme: MD3Theme) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.colors.background },
  content:     { padding: 20, paddingBottom: 40 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading:     { fontSize: 24, fontWeight: '700', color: theme.colors.onBackground, marginBottom: 8 },
  subheading:  { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 24, lineHeight: 20 },
  card: {
    flexDirection: 'row', gap: 14, padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: theme.colors.outlineVariant,
    elevation: 1,
  },
  lockedCard:     { opacity: 0.65 },
  avatarCircle:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji:    { fontSize: 28 },
  cardBody:       { flex: 1 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  personaName:    { fontSize: 17, fontWeight: '700' },
  tagline:        { fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  description:    { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18, marginBottom: 8 },
  specialtyChip:  { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  specialtyText:  { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  premiumBadge:   { backgroundColor: '#E65100', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  premiumBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  selectedBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  selectedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  confirmButton: {
    marginTop: 8, backgroundColor: '#6A1B9A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
