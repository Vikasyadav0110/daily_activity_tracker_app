import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { getLevelInfo } from '@services/xp/xpEngine';
import type { TeamMember } from '@services/social/teamService';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  member: TeamMember;
  rank: number;
  isCurrentUser: boolean;
}

export function TeamMemberCard({ member, rank, isCurrentUser }: Props) {
  const theme = useTheme();
  const { current } = getLevelInfo(member.weekXp * 4); // rough total estimate for level display
  const medal = RANK_MEDALS[rank] ?? `#${rank + 1}`;

  return (
    <Surface
      style={[
        styles.row,
        {
          backgroundColor: isCurrentUser
            ? theme.colors.primaryContainer
            : theme.colors.surface,
        },
      ]}
      elevation={0}
    >
      <Text style={styles.medal}>{medal}</Text>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>
          {member.avatarInitials}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.name,
              {
                color: isCurrentUser
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurface,
                fontWeight: isCurrentUser ? '800' : '600',
              },
            ]}
          >
            {isCurrentUser ? 'You' : member.displayName}
          </Text>
          {member.role === 'admin' && (
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text style={[styles.roleText, { color: theme.colors.onSecondaryContainer }]}>
                Admin
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
          {current.icon} Level {member.level}
        </Text>
      </View>
      <Text
        style={[
          styles.xp,
          { color: isCurrentUser ? theme.colors.primary : theme.colors.onSurfaceVariant },
        ]}
      >
        {member.weekXp} XP
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  medal: { fontSize: 20, width: 28, textAlign: 'center' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14 },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleText: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 11 },
  xp: { fontSize: 14, fontWeight: '700' },
});
