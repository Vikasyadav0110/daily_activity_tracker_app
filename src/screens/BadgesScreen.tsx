import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getAllBadges } from '@services/db/badgesRepo';
import type { Badge } from '@services/db/badgesRepo';

export function BadgesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    getAllBadges()
      .then(setBadges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const earned = badges.filter((b) => b.is_earned);
  const locked = badges.filter((b) => !b.is_earned);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: theme.colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('badges.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Progress strip */}
      <View style={[styles.progressStrip, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text style={[styles.progressText, { color: theme.colors.onPrimaryContainer }]}>
          {earned.length}/{badges.length} {t('badges.earned')}
        </Text>
        <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: badges.length > 0 ? `${Math.round((earned.length / badges.length) * 100)}%` as any : '0%',
                backgroundColor: theme.colors.onPrimaryContainer,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Earned */}
        {earned.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              🏆 {t('badges.earned')} ({earned.length})
            </Text>
            <View style={styles.grid}>
              {earned.map((badge) => (
                <View
                  key={badge.badge_key}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: '#FFD700',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.badge_icon}</Text>
                  <Text style={[styles.badgeName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {badge.badge_name}
                  </Text>
                  {badge.unlocked_at && (
                    <Text style={[styles.badgeDate, { color: theme.colors.onSurfaceVariant }]}>
                      {badge.unlocked_at.slice(0, 10)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginTop: 20 }]}>
              🔒 {t('badges.locked')} ({locked.length})
            </Text>
            <View style={styles.grid}>
              {locked.map((badge) => (
                <View
                  key={badge.badge_key}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      opacity: 0.6,
                    },
                  ]}
                >
                  <Text style={[styles.badgeIcon, { opacity: 0.4 }]}>{badge.badge_icon}</Text>
                  <Text style={[styles.badgeName, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                    {badge.badge_name}
                  </Text>
                  <Text style={[styles.badgeDate, { color: theme.colors.onSurfaceVariant }]}>
                    {t('badges.locked')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {badges.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {t('badges.no_badges')}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  progressStrip: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  progressText: { fontSize: 14, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '30%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    minHeight: 110,
    justifyContent: 'center',
  },
  badgeIcon: { fontSize: 32 },
  badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  badgeDate: { fontSize: 9, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 60 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
