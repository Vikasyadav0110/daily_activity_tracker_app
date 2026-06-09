import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useProStore } from '@store/proStore';

interface Props {
  children: React.ReactNode;
  /** Show lock overlay when not Pro. If false, hides children entirely. */
  blurMode?: boolean;
  featureLabel?: string;
}

/**
 * Wraps Pro-gated content. When user is not Pro:
 * - blurMode=true: shows blurred content + lock overlay
 * - blurMode=false (default): shows a "locked" placeholder card
 */
export function ProGate({ children, blurMode = false, featureLabel }: Props) {
  const theme = useTheme();
  const isPro = useProStore((s) => s.isPro);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (isPro) return <>{children}</>;

  if (blurMode) {
    return (
      <View style={styles.blurWrapper}>
        <View style={styles.blurContent} pointerEvents="none">
          {children}
        </View>
        <TouchableOpacity
          style={[styles.lockOverlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          onPress={() => navigation.navigate('Paywall')}
          activeOpacity={0.9}
        >
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Pro Feature</Text>
          {featureLabel && (
            <Text style={styles.lockSub}>{featureLabel}</Text>
          )}
          <View style={styles.unlockBtn}>
            <Text style={styles.unlockText}>Upgrade to Pro</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.lockedCard, { backgroundColor: theme.colors.surfaceVariant }]}
      onPress={() => navigation.navigate('Paywall')}
    >
      <Text style={styles.lockIcon}>🔒</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.lockedTitle, { color: theme.colors.onSurface }]}>
          {featureLabel ?? 'Pro Feature'}
        </Text>
        <Text style={[styles.lockedSub, { color: theme.colors.onSurfaceVariant }]}>
          Upgrade to Pro to unlock
        </Text>
      </View>
      <Text style={[styles.ctaChip, { color: theme.colors.primary }]}>Upgrade →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  blurWrapper: { position: 'relative' },
  blurContent: { opacity: 0.15 },
  lockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 20,
  },
  lockIcon: { fontSize: 28 },
  lockTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
  lockSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
  unlockBtn: {
    marginTop: 6,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unlockText: { color: '#1565C0', fontSize: 13, fontWeight: '800' },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  lockedTitle: { fontSize: 14, fontWeight: '600' },
  lockedSub: { fontSize: 11, marginTop: 1 },
  ctaChip: { fontSize: 13, fontWeight: '700' },
});
