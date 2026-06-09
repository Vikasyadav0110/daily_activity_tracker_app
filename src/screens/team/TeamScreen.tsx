import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/authStore';
import { useXPStore } from '@store/xpStore';
import {
  getUserTeam,
  getTeamMembers,
  getTeamChallenges,
  createTeam,
  joinTeamByCode,
  createTeamChallenge,
  leaveTeam,
  type Team,
  type TeamMember,
  type TeamChallenge,
} from '@services/social/teamService';
import { TeamMemberCard } from '@components/team/TeamMemberCard';
import { upsertLeaderboard } from '@services/social/friendsService';

type View = 'loading' | 'no_team' | 'create' | 'join' | 'dashboard';

export function TeamScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { weekXp, level } = useXPStore();

  const [view, setView] = useState<View>('loading');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);

  // Create team form
  const [teamName, setTeamName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Join team form
  const [inviteCode, setInviteCode] = useState('');

  // New challenge form
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [targetMetric, setTargetMetric] = useState('days');
  const [targetCount, setTargetCount] = useState('30');
  const [challengeEndDate, setChallengeEndDate] = useState('');

  const loadTeam = useCallback(async () => {
    if (!user) return;
    try {
      await upsertLeaderboard(user.id, weekXp, level).catch(() => {});
      const userTeam = await getUserTeam(user.id);
      if (!userTeam) {
        setView('no_team');
        return;
      }
      const [teamMembers, teamChallenges] = await Promise.all([
        getTeamMembers(userTeam.id),
        getTeamChallenges(userTeam.id),
      ]);
      setTeam(userTeam);
      setMembers(teamMembers);
      setChallenges(teamChallenges);
      setView('dashboard');
    } catch {
      setView('no_team');
    }
  }, [user, weekXp, level]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  async function handleCreateTeam() {
    if (!user || !teamName.trim()) return;
    setSubmitting(true);
    try {
      const newTeam = await createTeam(user.id, teamName.trim(), companyName.trim() || undefined);
      setTeam(newTeam);
      setMembers([{
        userId: user.id,
        email: user.email ?? '',
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'You',
        role: 'admin',
        weekXp,
        level,
        joinedAt: new Date().toISOString(),
        avatarInitials: (user.email ?? 'U').slice(0, 2).toUpperCase(),
      }]);
      setChallenges([]);
      setView('dashboard');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinTeam() {
    if (!user || !inviteCode.trim()) return;
    setSubmitting(true);
    try {
      await joinTeamByCode(user.id, inviteCode.trim());
      await loadTeam();
    } catch (e) {
      Alert.alert('Invalid Code', String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateChallenge() {
    if (!team || !challengeName.trim() || !challengeEndDate.trim()) return;
    setSubmitting(true);
    try {
      await createTeamChallenge(
        team.id,
        challengeName.trim(),
        targetMetric,
        parseInt(targetCount, 10) || 30,
        challengeEndDate.trim()
      );
      setShowNewChallenge(false);
      setChallengeName('');
      await loadTeam();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeaveTeam() {
    if (!user || !team) return;
    Alert.alert(
      t('team.leave_team'),
      t('team.leave_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('team.leave_team'),
          style: 'destructive',
          onPress: async () => {
            await leaveTeam(user.id, team.id);
            setTeam(null);
            setView('no_team');
          },
        },
      ]
    );
  }

  if (view === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (view === 'create') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity onPress={() => setView('no_team')} style={styles.backBtn}>
              <Text style={{ color: theme.colors.primary }}>← {t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('team.create_title')}
            </Text>
            <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <FormField
                label={t('team.team_name')}
                value={teamName}
                onChange={setTeamName}
                placeholder={t('team.team_name_placeholder')}
                theme={theme}
              />
              <FormField
                label={`${t('team.company_name')} (${t('common.optional')})`}
                value={companyName}
                onChange={setCompanyName}
                placeholder={t('team.company_placeholder')}
                theme={theme}
              />
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleCreateTeam}
                disabled={submitting || !teamName.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: theme.colors.onPrimary }]}>
                    {t('team.create_btn')}
                  </Text>
                )}
              </TouchableOpacity>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (view === 'join') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity onPress={() => setView('no_team')} style={styles.backBtn}>
              <Text style={{ color: theme.colors.primary }}>← {t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('team.join_title')}
            </Text>
            <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <FormField
                label={t('team.invite_code')}
                value={inviteCode}
                onChange={(v) => setInviteCode(v.toUpperCase())}
                placeholder="e.g. ABC123"
                theme={theme}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleJoinTeam}
                disabled={submitting || inviteCode.length < 6}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: theme.colors.onPrimary }]}>
                    {t('team.join_btn')}
                  </Text>
                )}
              </TouchableOpacity>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (view === 'no_team') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('team.title')}
          </Text>
          <View style={styles.noTeamHero}>
            <Text style={styles.heroEmoji}>🏢</Text>
            <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
              {t('team.no_team_title')}
            </Text>
            <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.no_team_sub')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setView('create')}
          >
            <Text style={[styles.submitText, { color: theme.colors.onPrimary }]}>
              🏢 {t('team.create_team')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.colors.surface, marginTop: 10 },
            ]}
            onPress={() => setView('join')}
          >
            <Text style={[styles.submitText, { color: theme.colors.primary }]}>
              🔗 {t('team.join_with_code')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.dashHeader}>
          <View>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {team?.teamName}
            </Text>
            {team?.companyName && (
              <Text style={[styles.companyName, { color: theme.colors.onSurfaceVariant }]}>
                {team.companyName}
              </Text>
            )}
          </View>
          <Surface
            style={[styles.inviteCode, { backgroundColor: theme.colors.primaryContainer }]}
            elevation={0}
          >
            <Text style={[styles.inviteLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.invite')}
            </Text>
            <Text style={[styles.inviteCodeText, { color: theme.colors.primary }]}>
              {team?.inviteCode}
            </Text>
          </Surface>
        </View>

        {/* Member stats */}
        <View style={styles.statsRow}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {team?.memberCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.members')}
            </Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {members.reduce((sum, m) => sum + m.weekXp, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.team_xp')}
            </Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {challenges.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.active_challenges')}
            </Text>
          </Surface>
        </View>

        {/* Leaderboard */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          {t('team.leaderboard')}
        </Text>
        <View style={styles.memberList}>
          {members.map((m, i) => (
            <TeamMemberCard
              key={m.userId}
              member={m}
              rank={i}
              isCurrentUser={m.userId === user?.id}
            />
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Challenges */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('team.challenges')}
          </Text>
          {team?.adminUserId === user?.id && (
            <TouchableOpacity onPress={() => setShowNewChallenge((v) => !v)}>
              <Text style={[styles.addBtn, { color: theme.colors.primary }]}>
                + {t('team.add_challenge')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showNewChallenge && (
          <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <FormField label={t('team.challenge_name')} value={challengeName} onChange={setChallengeName}
              placeholder={t('team.challenge_name_placeholder')} theme={theme} />
            <FormField label={t('team.end_date')} value={challengeEndDate} onChange={setChallengeEndDate}
              placeholder="YYYY-MM-DD" theme={theme} />
            <FormField label={`${t('team.target')} (${t('team.days')})`} value={targetCount}
              onChange={setTargetCount} placeholder="30" theme={theme} keyboardType="numeric" />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateChallenge}
              disabled={submitting}
            >
              <Text style={[styles.submitText, { color: theme.colors.onPrimary }]}>
                {t('team.create_challenge')}
              </Text>
            </TouchableOpacity>
          </Surface>
        )}

        {challenges.length === 0 ? (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {t('team.no_challenges')}
            </Text>
          </Surface>
        ) : (
          <View style={styles.challengeList}>
            {challenges.map((c) => (
              <Surface
                key={c.id}
                style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}
                elevation={0}
              >
                <Text style={[styles.challengeTitle, { color: theme.colors.onSurface }]}>
                  🎯 {c.challengeName}
                </Text>
                <Text style={[styles.challengeMeta, { color: theme.colors.onSurfaceVariant }]}>
                  {c.targetCount} {c.targetMetric ?? 'days'}
                  {c.endDate ? ` · ends ${c.endDate}` : ''}
                </Text>
              </Surface>
            ))}
          </View>
        )}

        <Divider style={styles.divider} />
        <TouchableOpacity onPress={handleLeaveTeam} style={styles.leaveBtn}>
          <Text style={[styles.leaveText, { color: theme.colors.error }]}>
            {t('team.leave_team')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  theme,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  theme: ReturnType<typeof useTheme>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.onSurface,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.background,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  companyName: { fontSize: 13 },
  // No-team hero
  noTeamHero: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  // Dashboard header
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  inviteCode: { borderRadius: 12, padding: 10, alignItems: 'center' },
  inviteLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteCodeText: { fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  // Sections
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { fontSize: 13, fontWeight: '600' },
  memberList: { gap: 8, marginBottom: 8 },
  divider: { marginVertical: 16 },
  // Challenges
  challengeList: { gap: 8 },
  challengeCard: { borderRadius: 14, padding: 14, gap: 4 },
  challengeTitle: { fontSize: 14, fontWeight: '700' },
  challengeMeta: { fontSize: 12 },
  emptyCard: { borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  // Form
  formCard: { borderRadius: 16, padding: 16, gap: 12, marginBottom: 12 },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '700' },
  // Leave
  leaveBtn: { alignItems: 'center', paddingVertical: 12 },
  leaveText: { fontSize: 13, fontWeight: '600' },
});
