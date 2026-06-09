import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@store/authStore';
import { useProStore } from '@store/proStore';
import { purchasePlan, restorePurchase } from '@services/subscription/razorpayService';
import { PLANS, PRO_FEATURES } from '@services/subscription/subscriptionService';
import type { Plan } from '@services/subscription/subscriptionService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

const FEATURE_ICONS: Record<string, string> = {
  cloud_sync: '☁️',
  advanced_analytics: '📊',
  csv_export: '📥',
  social_friends: '👥',
  challenges: '🏆',
};

const FREE_FEATURES = [
  { icon: '✅', label: 'Unlimited habits & streaks' },
  { icon: '✅', label: 'Basic progress & calendar' },
  { icon: '✅', label: 'XP & levels (local)' },
  { icon: '✅', label: '5 languages' },
];

export function PaywallScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isLocalOnly } = useAuthStore();
  const { setSubscription } = useProStore();

  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro_annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handlePurchase() {
    if (isLocalOnly || !user) {
      navigation.navigate('Auth');
      return;
    }
    setPurchasing(true);
    try {
      const result = await purchasePlan(selectedPlan, user.id, user.email ?? '');
      if (result.success) {
        setSubscription(result.plan, 'active', null);
        Alert.alert(
          t('paywall.success_title'),
          t('paywall.success_body'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (!result.cancelled) {
        Alert.alert(t('paywall.failed_title'), result.error ?? t('paywall.failed_body'));
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (!user) return;
    setRestoring(true);
    try {
      const restored = await restorePurchase(user.id);
      if (restored) {
        // Reload subscription into store
        await useProStore.getState().loadSubscription();
        Alert.alert(t('paywall.restore_success'), '', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('paywall.restore_none'));
      }
    } finally {
      setRestoring(false);
    }
  }

  const selectedPlanData = PLANS[selectedPlan as keyof typeof PLANS];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>⚡</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.onBackground }]}>
            {t('paywall.title')}
          </Text>
          <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
            {t('paywall.subtitle')}
          </Text>
        </View>

        {/* Pro features */}
        <Surface style={[styles.featuresCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            {t('paywall.pro_includes')}
          </Text>
          {Object.values(PRO_FEATURES).map((f) => (
            <View key={f.key} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{FEATURE_ICONS[f.key] ?? '✨'}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                  {f.title}
                </Text>
              </View>
              <View style={[styles.proBadge, { backgroundColor: '#BF360C' }]}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <Text style={[styles.freeLabel, { color: theme.colors.onSurfaceVariant }]}>
            Always free:
          </Text>
          {FREE_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureTitle, { color: theme.colors.onSurfaceVariant }]}>
                {f.label}
              </Text>
            </View>
          ))}
        </Surface>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {(Object.values(PLANS) as typeof PLANS[keyof typeof PLANS][]).map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id as Plan)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {'savingsLabel' in plan && (
                  <View style={[styles.savingsBadge, { backgroundColor: '#2E7D32' }]}>
                    <Text style={styles.savingsText}>{plan.savingsLabel}</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.planPeriod,
                    { color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant },
                  ]}
                >
                  {plan.period === 'month' ? 'Monthly' : 'Annual'}
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
                  ]}
                >
                  ₹{plan.price}
                </Text>
                <Text style={[styles.planPer, { color: theme.colors.onSurfaceVariant }]}>
                  /{plan.period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            {
              backgroundColor: purchasing ? theme.colors.surfaceVariant : theme.colors.primary,
            },
          ]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={[styles.ctaText, { color: theme.colors.onPrimary }]}>
              {isLocalOnly
                ? t('paywall.sign_in_to_subscribe')
                : `${t('paywall.subscribe')} · ₹${selectedPlanData?.price}/${selectedPlanData?.period}`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        {!isLocalOnly && (
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring ? (
              <ActivityIndicator size={14} color={theme.colors.primary} />
            ) : (
              <Text style={[styles.restoreText, { color: theme.colors.primary }]}>
                {t('paywall.restore')}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.legalText, { color: theme.colors.onSurfaceVariant }]}>
          {t('paywall.legal')}
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  heroSection: { alignItems: 'center', marginBottom: 28, gap: 8 },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  featuresCard: { borderRadius: 20, padding: 18, marginBottom: 20, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 20, width: 28 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 13, fontWeight: '500' },
  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  divider: { height: 1, marginVertical: 4 },
  freeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    gap: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  savingsText: { color: 'white', fontSize: 10, fontWeight: '700' },
  planPeriod: { fontSize: 12, fontWeight: '600' },
  planPrice: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  planPer: { fontSize: 11 },
  ctaBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: { fontSize: 16, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { fontSize: 13, fontWeight: '600' },
  legalText: { fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 8 },
});
