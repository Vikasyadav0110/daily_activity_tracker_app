import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useProStore } from '@store/proStore';

const PP_COLOR = '#6A1B9A';

interface Props {
  children: React.ReactNode;
  feature?: string;
  blurMode?: boolean;
}

/** Gate Premium+ features. Shows children to Premium+ subscribers; paywall CTA otherwise. */
export function PremiumPlusGate({ children, feature, blurMode = false }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isPremiumPlus = useProStore((s) => s.isPremiumPlus);

  if (isPremiumPlus) return <>{children}</>;

  if (blurMode) {
    return (
      <View style={styles.blurWrapper}>
        <View style={styles.blurOverlay} pointerEvents="none">
          {children}
        </View>
        <View style={[styles.blurMask, { backgroundColor: theme.colors.background + 'CC' }]}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockLabel, { color: theme.colors.onBackground }]}>Premium+ feature</Text>
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: PP_COLOR }]}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.upgradeBtnText}>{t('paywall.upgrade_pp_cta')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Surface style={[styles.placeholder, { backgroundColor: PP_COLOR + '0D' }]} elevation={0}>
      <Text style={styles.lockEmoji}>🔒</Text>
      <Text style={[styles.featureLabel, { color: theme.colors.onSurface }]}>
        {feature ?? 'Premium+ Feature'}
      </Text>
      <Text style={[styles.ppLabel, { color: PP_COLOR }]}>Premium+</Text>
      <TouchableOpacity
        style={[styles.upgradeBtn, { backgroundColor: PP_COLOR }]}
        onPress={() => navigation.navigate('Paywall')}
      >
        <Text style={styles.upgradeBtnText}>{t('paywall.upgrade_pp_cta')} · ₹149/mo</Text>
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  blurWrapper: { position: 'relative' },
  blurOverlay: { opacity: 0.12 },
  blurMask: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  lockIcon: { fontSize: 28 },
  lockLabel: { fontSize: 13, fontWeight: '600' },
  placeholder: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  lockEmoji: { fontSize: 32 },
  featureLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  ppLabel: { fontSize: 12, fontWeight: '700' },
  upgradeBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
});
