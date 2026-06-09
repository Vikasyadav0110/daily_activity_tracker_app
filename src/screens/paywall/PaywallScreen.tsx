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
import { useRegionStore, formatPrice } from '@store/regionStore';
import { purchasePlan, restorePurchase } from '@services/subscription/razorpayService';
import {
  PLANS,
  PRO_FEATURES,
  PREMIUM_PLUS_FEATURES,
  type Plan,
} from '@services/subscription/subscriptionService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Tier = 'pro' | 'premium_plus';

const PRO_COLOR = '#BF360C';
const PP_COLOR = '#6A1B9A';

const PRO_FEATURE_ICONS: Record<string, string> = {
  cloud_sync: '☁️',
  advanced_analytics: '📊',
  csv_export: '📥',
  social_friends: '👥',
  challenges: '🏆',
};

const PP_FEATURE_ICONS: Record<string, string> = {
  ai_weekly_review: '🧠',
  ai_coach: '🤖',
  mood_tracking: '💚',
  mood_correlation: '📈',
  vrat_fasting: '🕉️',
  mantra_counter: '🙏',
  ayurveda_tips: '🌿',
  smart_schedule: '📅',
};

const FREE_FEATURES = [
  { icon: '✅', label: 'Unlimited habits & streaks' },
  { icon: '✅', label: 'Basic progress & calendar' },
  { icon: '✅', label: 'XP & levels (local)' },
  { icon: '✅', label: '5 languages' },
];

const TIER_PLANS: Record<Tier, Plan[]> = {
  pro: ['pro_monthly', 'pro_annual', 'lifetime_pro'],
  premium_plus: ['premium_plus_monthly', 'premium_plus_annual'],
};

export function PaywallScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isLocalOnly } = useAuthStore();
  const { setSubscription } = useProStore();

  const { region, prices } = useRegionStore();

  const [tier, setTier] = useState<Tier>('pro');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro_annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Get region-aware price for a plan, falling back to PLANS static price
  function getDisplayPrice(planId: string): string {
    const rp = prices.find((p) => p.plan === planId);
    if (rp) return formatPrice(rp.amount, rp.currency, region.currency_symbol);
    const staticPlan = PLANS[planId as keyof typeof PLANS];
    return `₹${staticPlan?.price ?? '—'}`;
  }

  const accentColor = tier === 'premium_plus' ? PP_COLOR : PRO_COLOR;
  const availablePlans = TIER_PLANS[tier].map((p) => PLANS[p as keyof typeof PLANS]);

  function handleTierChange(newTier: Tier) {
    setTier(newTier);
    setSelectedPlan(newTier === 'premium_plus' ? 'premium_plus_monthly' : 'pro_annual');
  }

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
        await useProStore.getState().loadSubscription();
        Alert.alert(t('paywall.restore_success'), '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{tier === 'premium_plus' ? '🧠' : '⚡'}</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.onBackground }]}>
            {t('paywall.title')}
          </Text>
          <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
            {t('paywall.subtitle')}
          </Text>
        </View>

        {/* Tier toggle */}
        <View style={[styles.tierToggle, { backgroundColor: theme.colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[styles.tierBtn, tier === 'pro' && { backgroundColor: PRO_COLOR }]}
            onPress={() => handleTierChange('pro')}
          >
            <Text style={[styles.tierBtnText, { color: tier === 'pro' ? 'white' : theme.colors.onSurfaceVariant }]}>
              ⚡ Pro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tierBtn, tier === 'premium_plus' && { backgroundColor: PP_COLOR }]}
            onPress={() => handleTierChange('premium_plus')}
          >
            <Text style={[styles.tierBtnText, { color: tier === 'premium_plus' ? 'white' : theme.colors.onSurfaceVariant }]}>
              🧠 Premium+
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature list */}
        <Surface style={[styles.featureCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          {tier === 'pro' ? (
            <>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                {t('paywall.pro_includes')}
              </Text>
              {Object.values(PRO_FEATURES).map((f) => (
                <View key={f.key} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{PRO_FEATURE_ICONS[f.key] ?? '✨'}</Text>
                  <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>{f.title}</Text>
                  <View style={[styles.badge, { backgroundColor: PRO_COLOR }]}>
                    <Text style={styles.badgeText}>PRO</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                {t('paywall.pp_includes')}
              </Text>
              <Text style={[styles.ppNote, { color: theme.colors.onSurfaceVariant }]}>
                Everything in Pro, plus:
              </Text>
              {Object.values(PREMIUM_PLUS_FEATURES).map((f) => (
                <View key={f.key} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{PP_FEATURE_ICONS[f.key] ?? '🌟'}</Text>
                  <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>{f.title}</Text>
                  <View style={[styles.badge, { backgroundColor: PP_COLOR }]}>
                    <Text style={styles.badgeText}>PP+</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <Text style={[styles.freeLabel, { color: theme.colors.onSurfaceVariant }]}>Always free:</Text>
          {FREE_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureTitle, { color: theme.colors.onSurfaceVariant }]}>{f.label}</Text>
            </View>
          ))}
        </Surface>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {availablePlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id as Plan)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isSelected ? accentColor + '20' : theme.colors.surface,
                    borderColor: isSelected ? accentColor : theme.colors.outline,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {'savingsLabel' in plan && (
                  <View style={[styles.savingsBadge, { backgroundColor: '#2E7D32' }]}>
                    <Text style={styles.savingsText}>{plan.savingsLabel}</Text>
                  </View>
                )}
                <Text style={[styles.planPeriod, { color: isSelected ? accentColor : theme.colors.onSurfaceVariant }]}>
                  {plan.period === 'month' ? 'Monthly' : plan.period === 'year' ? 'Annual' : 'Lifetime'}
                </Text>
                <Text style={[styles.planPrice, { color: isSelected ? accentColor : theme.colors.onSurface }]}>
                  {getDisplayPrice(plan.id)}
                </Text>
                <Text style={[styles.planPer, { color: theme.colors.onSurfaceVariant }]}>
                  /{plan.period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tier === 'premium_plus' && (
          <Surface style={[styles.trialBanner, { backgroundColor: PP_COLOR + '15' }]} elevation={0}>
            <Text style={[styles.trialText, { color: PP_COLOR }]}>
              🎁 {t('paywall.trial_14_days')}
            </Text>
          </Surface>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: purchasing ? theme.colors.surfaceVariant : accentColor }]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={accentColor} />
          ) : (
            <Text style={styles.ctaText}>
              {isLocalOnly
                ? t('paywall.sign_in_to_subscribe')
                : `${t('paywall.subscribe')} · ${getDisplayPrice(selectedPlan)}/${selectedPlanData?.period}`}
            </Text>
          )}
        </TouchableOpacity>

        {!isLocalOnly && (
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size={14} color={theme.colors.primary} />
              : <Text style={[styles.restoreText, { color: theme.colors.primary }]}>{t('paywall.restore')}</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={[styles.legal, { color: theme.colors.onSurfaceVariant }]}>{t('paywall.legal')}</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  hero: { alignItems: 'center', marginBottom: 24, gap: 8 },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tierToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  tierBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tierBtnText: { fontSize: 14, fontWeight: '700' },
  featureCard: { borderRadius: 20, padding: 18, marginBottom: 20, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  ppNote: { fontSize: 12, marginTop: -6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 20, width: 28 },
  featureTitle: { flex: 1, fontSize: 13, fontWeight: '500' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
  divider: { height: 1, marginVertical: 4 },
  freeLabel: { fontSize: 12, fontWeight: '600' },
  planRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  planCard: { flex: 1, minWidth: 80, borderRadius: 16, padding: 12, alignItems: 'center', gap: 2 },
  savingsBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  savingsText: { color: 'white', fontSize: 9, fontWeight: '700' },
  planPeriod: { fontSize: 10, fontWeight: '600' },
  planPrice: { fontSize: 22, fontWeight: '800' },
  planPer: { fontSize: 10 },
  trialBanner: { borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16 },
  trialText: { fontSize: 14, fontWeight: '700' },
  ctaBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  restoreText: { fontSize: 13 },
  legal: { fontSize: 11, textAlign: 'center', lineHeight: 17, marginBottom: 8 },
});
