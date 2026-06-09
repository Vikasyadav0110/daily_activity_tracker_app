import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import type { Challenge } from '@services/social/friendsService';

interface Props {
  challenge: Challenge;
  onAccept?: (id: string) => void;
}

export function ChallengeCard({ challenge, onAccept }: Props) {
  const theme = useTheme();
  const daysLeft = Math.ceil(
    (new Date(challenge.deadline).getTime() - Date.now()) / 86400000
  );
  const progress = Math.min(1, challenge.currentDays / challenge.targetDays);

  const statusColor =
    challenge.status === 'completed' ? '#2E7D32' :
    challenge.status === 'failed' ? theme.colors.error :
    theme.colors.primary;

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={0}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.activity, { color: theme.colors.onSurface }]}>
            🎯 {challenge.activityName}
          </Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {challenge.status === 'pending' ? 'Pending' :
             challenge.status === 'active' ? 'Active' :
             challenge.status === 'completed' ? '✓ Done' : '✗ Failed'}
          </Text>
        </View>
        <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
          {challenge.isIncoming ? `From ${challenge.fromName}` : `To a friend`}
          {' · '}{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
        </Text>
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View
            style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: statusColor }]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
          {challenge.currentDays}/{challenge.targetDays}d
        </Text>
      </View>

      {challenge.isIncoming && challenge.status === 'pending' && onAccept && (
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onAccept(challenge.id)}
        >
          <Text style={[styles.acceptText, { color: theme.colors.onPrimary }]}>
            Accept Challenge
          </Text>
        </TouchableOpacity>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, gap: 10 },
  header: { gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activity: { fontSize: 14, fontWeight: '700', flex: 1 },
  status: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', width: 40 },
  acceptBtn: { borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  acceptText: { fontSize: 13, fontWeight: '700' },
});
