import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '@store/settingsStore';
import { useAuthStore } from '@store/authStore';
import { useProStore } from '@store/proStore';
import { useRegionStore, detectRegionCode, type Region } from '@store/regionStore';
import { signOut } from '@services/supabase/authService';
import { syncNow } from '@services/supabase/syncService';
import { syncFromHealth, isHealthAvailable, getHealthPlatform } from '@services/health/healthService';
import { refreshWidgetData } from '@services/widget/widgetDataService';
import { SUPPORTED_LANGUAGES } from '@i18n/index';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  bn: 'বাংলা',
  es: 'Español',
  pt: 'Português',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  de: 'Deutsch',
};

const REGION_OPTIONS: Region[] = [
  { code: 'IN', name: '🇮🇳 India',          currency: 'INR', currency_symbol: '₹',  tax_label: 'GST', tax_rate: 0.18 },
  { code: 'US', name: '🇺🇸 United States',   currency: 'USD', currency_symbol: '$',  tax_label: 'Tax', tax_rate: 0.08 },
  { code: 'GB', name: '🇬🇧 United Kingdom',  currency: 'GBP', currency_symbol: '£',  tax_label: 'VAT', tax_rate: 0.20 },
  { code: 'SG', name: '🇸🇬 Singapore',       currency: 'SGD', currency_symbol: 'S$', tax_label: 'GST', tax_rate: 0.09 },
  { code: 'AU', name: '🇦🇺 Australia',       currency: 'AUD', currency_symbol: 'A$', tax_label: 'GST', tax_rate: 0.10 },
  { code: 'DE', name: '🇩🇪 Germany',         currency: 'EUR', currency_symbol: '€',  tax_label: 'VAT', tax_rate: 0.19 },
  { code: 'FR', name: '🇫🇷 France',          currency: 'EUR', currency_symbol: '€',  tax_label: 'TVA', tax_rate: 0.20 },
  { code: 'JP', name: '🇯🇵 Japan',           currency: 'JPY', currency_symbol: '¥',  tax_label: 'Tax', tax_rate: 0.10 },
];

export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { language, theme: appTheme, notificationEnabled, setLanguage, setTheme, setNotificationEnabled } =
    useSettingsStore();
  const { user, isLocalOnly, signOut: storeSignOut } = useAuthStore();
  const { isPro, plan } = useProStore();
  const { region, setRegion } = useRegionStore();
  const [syncing, setSyncing] = useState(false);
  const [healthSyncing, setHealthSyncing] = useState(false);
  const [widgetRefreshing, setWidgetRefreshing] = useState(false);
  const [detectingRegion, setDetectingRegion] = useState(false);

  async function handleSignOut() {
    Alert.alert(
      t('auth.sign_out'),
      'Your local data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('auth.sign_out'),
          style: 'destructive',
          onPress: async () => {
            await signOut().catch(() => {});
            storeSignOut();
          },
        },
      ]
    );
  }

  async function handleHealthSync() {
    const available = await isHealthAvailable();
    if (!available) {
      const platform = getHealthPlatform();
      const name = platform === 'apple_health' ? 'Apple Health' : platform === 'google_fit' ? 'Google Fit' : 'Health';
      Alert.alert(
        t('settings.health_unavailable_title'),
        t('settings.health_unavailable_body', { platform: name })
      );
      return;
    }
    setHealthSyncing(true);
    const result = await syncFromHealth(7);
    setHealthSyncing(false);
    if (result.error) {
      Alert.alert(t('settings.health_sync_failed'), result.error);
    } else {
      Alert.alert(t('settings.health_sync_success'), `${result.synced} activities synced`);
    }
  }

  async function handleWidgetRefresh() {
    setWidgetRefreshing(true);
    await refreshWidgetData().catch(() => {});
    setWidgetRefreshing(false);
    Alert.alert(t('settings.widget_refreshed'));
  }

  async function handleSync() {
    if (!user) return;
    setSyncing(true);
    const result = await syncNow(user.id);
    setSyncing(false);
    if (result.error) {
      Alert.alert(t('auth.sync_failed'), result.error);
    } else {
      Alert.alert(t('auth.sync_success'), `↑ ${result.pushed} pushed · ↓ ${result.pulled} pulled`);
    }
  }

  async function handleAutoDetectRegion() {
    setDetectingRegion(true);
    const code = await detectRegionCode();
    const detected = REGION_OPTIONS.find((r) => r.code === code) ?? REGION_OPTIONS[0];
    setRegion(detected);
    setDetectingRegion(false);
    Alert.alert('Region detected', `Set to ${detected.name} (${detected.currency})`);
  }

  function handleSelectRegion(r: Region) {
    setRegion(r);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('settings.title')}
        </Text>

        {/* Pro subscription section */}
        <List.Section>
          <List.Subheader>{t('paywall.plan')}</List.Subheader>
          {isPro ? (
            <List.Item
              title={`⚡ Pro · ${plan === 'pro_annual' ? 'Annual' : 'Monthly'}`}
              description={t('paywall.plan_active')}
              left={() => <List.Icon icon="crown" color="#BF360C" />}
            />
          ) : (
            <List.Item
              title={t('paywall.upgrade_cta')}
              description={t('paywall.upgrade_desc')}
              left={() => <List.Icon icon="crown-outline" />}
              onPress={() => navigation.navigate('Paywall')}
              right={() => (
                <Text style={{ color: '#BF360C', fontWeight: '700', fontSize: 12, alignSelf: 'center', marginRight: 8 }}>
                  PRO
                </Text>
              )}
            />
          )}
        </List.Section>

        <Divider />

        {/* Account section */}
        <List.Section>
          <List.Subheader>{t('auth.account')}</List.Subheader>
          {isLocalOnly ? (
            <List.Item
              title={t('auth.continue_without_account')}
              description="Tap to sign in and enable cloud sync"
              left={() => <List.Icon icon="account-outline" />}
              onPress={() => navigation.navigate('Auth')}
            />
          ) : (
            <>
              <List.Item
                title={t('auth.signed_in_as')}
                description={user?.email ?? user?.displayName ?? ''}
                left={() => <List.Icon icon="account-check" color={theme.colors.primary} />}
              />
              <List.Item
                title={syncing ? 'Syncing...' : t('auth.sync_now')}
                left={() => syncing
                  ? <ActivityIndicator size={16} style={styles.syncIcon} />
                  : <List.Icon icon="cloud-sync" />
                }
                onPress={handleSync}
                disabled={syncing}
              />
              <List.Item
                title={t('auth.sign_out')}
                left={() => <List.Icon icon="logout" />}
                onPress={handleSignOut}
                titleStyle={{ color: theme.colors.error }}
              />
            </>
          )}
        </List.Section>

        <Divider />

        {/* Region & Currency */}
        <List.Section>
          <List.Subheader>Region & Currency</List.Subheader>
          <List.Item
            title={detectingRegion ? 'Detecting…' : 'Auto-detect my region'}
            description="Uses your IP address to set the right currency"
            left={() => detectingRegion
              ? <ActivityIndicator size={16} style={styles.syncIcon} />
              : <List.Icon icon="crosshairs-gps" color={theme.colors.primary} />
            }
            onPress={handleAutoDetectRegion}
            disabled={detectingRegion}
          />
          {REGION_OPTIONS.map((r) => (
            <List.Item
              key={r.code}
              title={r.name}
              description={`${r.currency} · ${r.currency_symbol} · ${r.tax_label} ${Math.round(r.tax_rate * 100)}%`}
              onPress={() => handleSelectRegion(r)}
              right={() =>
                region.code === r.code ? (
                  <List.Icon icon="check-circle" color={theme.colors.primary} />
                ) : null
              }
            />
          ))}
        </List.Section>

        <Divider />

        {/* Language */}
        <List.Section>
          <List.Subheader>{t('settings.language')}</List.Subheader>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <List.Item
              key={lang}
              title={LANGUAGE_NAMES[lang] ?? lang}
              onPress={() => setLanguage(lang)}
              right={() =>
                language === lang ? (
                  <List.Icon icon="check" color={theme.colors.primary} />
                ) : null
              }
            />
          ))}
        </List.Section>

        <Divider />

        {/* Theme */}
        <List.Section>
          <List.Subheader>{t('settings.theme')}</List.Subheader>
          <List.Item
            title={t('settings.theme_light')}
            onPress={() => setTheme('light')}
            right={() => appTheme === 'light' ? <List.Icon icon="check" color={theme.colors.primary} /> : null}
          />
          <List.Item
            title={t('settings.theme_dark')}
            onPress={() => setTheme('dark')}
            right={() => appTheme === 'dark' ? <List.Icon icon="check" color={theme.colors.primary} /> : null}
          />
        </List.Section>

        <Divider />

        {/* Notifications */}
        <List.Section>
          <List.Subheader>{t('settings.notifications')}</List.Subheader>
          <List.Item
            title={t('settings.notifications_enabled')}
            right={() => (
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>

        <Divider />

        {/* Health Sync */}
        <List.Section>
          <List.Subheader>{t('settings.health_sync')}</List.Subheader>
          <List.Item
            title={healthSyncing ? t('settings.health_syncing') : t('settings.health_sync_btn')}
            description={t('settings.health_sync_desc')}
            left={() => healthSyncing
              ? <ActivityIndicator size={16} style={styles.syncIcon} />
              : <List.Icon icon="heart-pulse" color="#E53935" />
            }
            onPress={handleHealthSync}
            disabled={healthSyncing}
          />
        </List.Section>

        <Divider />

        {/* Widget */}
        <List.Section>
          <List.Subheader>{t('settings.widget')}</List.Subheader>
          <List.Item
            title={widgetRefreshing ? t('settings.widget_refreshing') : t('settings.widget_refresh_btn')}
            description={t('settings.widget_refresh_desc')}
            left={() => widgetRefreshing
              ? <ActivityIndicator size={16} style={styles.syncIcon} />
              : <List.Icon icon="widgets" />
            }
            onPress={handleWidgetRefresh}
            disabled={widgetRefreshing}
          />
        </List.Section>

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
            {t('settings.version', { version: '2.0.0' })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', padding: 20, paddingBottom: 8 },
  footer: { alignItems: 'center', padding: 24 },
  syncIcon: { marginLeft: 8, marginRight: 8 },
});
