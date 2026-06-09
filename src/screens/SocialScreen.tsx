import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useXPStore } from '@store/xpStore';
import { useAuthStore } from '@store/authStore';
import { useProStore } from '@store/proStore';
import { XPProgressCard } from '@components/social/XPProgressCard';
import { LeaderboardList } from '@components/social/LeaderboardList';
import { ChallengeCard } from '@components/social/ChallengeCard';
import { shareStreakCard } from '@services/social/shareService';
import {
  getFriendsLeaderboard,
  getActiveChallenges,
  searchUserByEmail,
  addFriend,
  acceptChallenge,
  upsertLeaderboard,
  type Friend,
  type Challenge,
} from '@services/social/friendsService';

export function SocialScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { totalXp, weekXp, level } = useXPStore();
  const { user, isLocalOnly } = useAuthStore();
  const isPro = useProStore((s) => s.isPro);

  const [sharing, setSharing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const loadCloudData = useCallback(async () => {
    if (!user) return;
    setLoadingCloud(true);
    try {
      // Push this week's XP to leaderboard table
      await upsertLeaderboard(user.id, weekXp, level).catch(() => {});
      const [lb, chal] = await Promise.all([
        getFriendsLeaderboard(user.id),
        getActiveChallenges(user.id),
      ]);
      setLeaderboard(lb);
      setChallenges(chal);
    } catch {
      // non-critical
    } finally {
      setLoadingCloud(false);
    }
  }, [user, weekXp, level]);

  useEffect(() => {
    if (user) loadCloudData();
  }, [user, loadCloudData]);

  async function handleShare() {
    setSharing(true);
    try {
      await shareStreakCard(totalXp, weekXp);
    } catch {
      // user dismissed share sheet
    } finally {
      setSharing(false);
    }
  }

  async function handleAddFriend() {
    if (!user || !addFriendEmail.trim()) return;
    setAddingFriend(true);
    try {
      const found = await searchUserByEmail(addFriendEmail.trim(), user.id);
      if (!found) {
        Alert.alert(t('social.user_not_found'), addFriendEmail);
        return;
      }
      await addFriend(user.id, found.id);
      setAddFriendEmail('');
      setShowAddFriend(false);
      await loadCloudData();
      Alert.alert(t('social.friend_added'), found.displayName);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleAcceptChallenge(challengeId: string) {
    try {
      await acceptChallenge(challengeId);
      await loadCloudData();
    } catch {
      Alert.alert('Error', 'Could not accept challenge.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('social.title')}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={[styles.shareBtn, { backgroundColor: theme.colors.primaryContainer }]}
          >
            {sharing ? (
              <ActivityIndicator size={14} color={theme.colors.primary} />
            ) : (
              <Text style={[styles.shareText, { color: theme.colors.primary }]}>
                📤 {t('social.share')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* XP Card — always visible */}
        <XPProgressCard totalXp={totalXp} weekXp={weekXp} />

        {isLocalOnly ? (
          /* Local-only CTA */
          <Surface
            style={[styles.ctaCard, { backgroundColor: theme.colors.surface }]}
            elevation={0}
          >
            <Text style={styles.ctaEmoji}>👥</Text>
            <Text style={[styles.ctaTitle, { color: theme.colors.onSurface }]}>
              {t('social.sign_in_for_friends')}
            </Text>
            <Text style={[styles.ctaSub, { color: theme.colors.onSurfaceVariant }]}>
              {t('social.sign_in_for_friends_sub')}
            </Text>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={[styles.ctaBtnText, { color: theme.colors.onPrimary }]}>
                {t('auth.sign_in')}
              </Text>
            </TouchableOpacity>
          </Surface>
        ) : !isPro ? (
          /* Signed in but not Pro — show Pro gate */
          <Surface
            style={[styles.ctaCard, { backgroundColor: theme.colors.surface }]}
            elevation={0}
          >
            <Text style={styles.ctaEmoji}>🏆</Text>
            <Text style={[styles.ctaTitle, { color: theme.colors.onSurface }]}>
              Friends & Leaderboard
            </Text>
            <Text style={[styles.ctaSub, { color: theme.colors.onSurfaceVariant }]}>
              Upgrade to Pro to compete on the leaderboard and send challenges to friends
            </Text>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: '#BF360C' }]}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Text style={[styles.ctaBtnText, { color: 'white' }]}>
                Upgrade to Pro ⚡
              </Text>
            </TouchableOpacity>
          </Surface>
        ) : (
          <>
            {/* Friends Leaderboard */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('social.leaderboard')}
                </Text>
                <TouchableOpacity onPress={() => setShowAddFriend((v) => !v)}>
                  <Text style={[styles.addBtn, { color: theme.colors.primary }]}>
                    + {t('social.add_friend')}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddFriend && (
                <Surface
                  style={[styles.addFriendCard, { backgroundColor: theme.colors.surface }]}
                  elevation={0}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.onSurface,
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder={t('social.enter_email')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={addFriendEmail}
                    onChangeText={setAddFriendEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAddFriend}
                    disabled={addingFriend}
                  >
                    {addingFriend ? (
                      <ActivityIndicator size={14} color={theme.colors.onPrimary} />
                    ) : (
                      <Text style={[styles.sendBtnText, { color: theme.colors.onPrimary }]}>
                        {t('social.send_request')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Surface>
              )}

              {loadingCloud ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
              ) : leaderboard.length > 0 ? (
                <LeaderboardList friends={leaderboard} currentUserId={user?.id ?? ''} />
              ) : (
                <Surface
                  style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
                  elevation={0}
                >
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {t('social.no_friends_yet')}
                  </Text>
                </Surface>
              )}
            </View>

            {/* Team Workspace entry */}
            <Divider style={styles.divider} />
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.teamEntry, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('Team')}
              >
                <Text style={styles.teamIcon}>🏢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginBottom: 0 }]}>
                    {t('team.title')}
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {t('team.entry_sub')}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Challenges */}
            <Divider style={styles.divider} />
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                {t('social.challenges')}
              </Text>
              {challenges.length === 0 ? (
                <Surface
                  style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
                  elevation={0}
                >
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {t('social.no_challenges')}
                  </Text>
                </Surface>
              ) : (
                <View style={{ gap: 10 }}>
                  {challenges.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      onAccept={handleAcceptChallenge}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700' },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  shareText: { fontSize: 13, fontWeight: '700' },
  section: { gap: 12, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { fontSize: 13, fontWeight: '600' },
  divider: { marginVertical: 16 },
  addFriendCard: { borderRadius: 14, padding: 14, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 13, fontWeight: '700' },
  ctaCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  ctaEmoji: { fontSize: 48 },
  ctaTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  ctaSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  ctaBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700' },
  emptyCard: { borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  teamEntry: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  teamIcon: { fontSize: 28 },
});
