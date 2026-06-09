import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { getLevelInfo } from '@services/xp/xpEngine';
import type { Friend } from '@services/social/friendsService';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  friends: Friend[];
  currentUserId: string;
}

export function LeaderboardList({ friends, currentUserId }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {friends.map((friend, i) => {
        const isMe = friend.id === currentUserId;
        const medal = RANK_MEDALS[i] ?? `#${i + 1}`;
        const { current } = getLevelInfo(friend.weekXp);

        return (
          <Surface
            key={friend.id}
            style={[
              styles.row,
              {
                backgroundColor: isMe
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
              },
            ]}
            elevation={0}
          >
            <Text style={styles.medal}>{medal}</Text>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>
                {friend.avatarInitials}
              </Text>
            </View>
            <View style={styles.info}>
              <Text
                style={[
                  styles.name,
                  {
                    color: isMe
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurface,
                    fontWeight: isMe ? '800' : '600',
                  },
                ]}
              >
                {friend.displayName} {current.icon}
              </Text>
              <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
                Level {friend.level}
              </Text>
            </View>
            <Text
              style={[
                styles.xp,
                {
                  color: isMe ? theme.colors.primary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {friend.weekXp} XP
            </Text>
          </Surface>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  medal: { fontSize: 20, width: 28, textAlign: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 14 },
  sub: { fontSize: 11, marginTop: 1 },
  xp: { fontSize: 14, fontWeight: '700' },
});
