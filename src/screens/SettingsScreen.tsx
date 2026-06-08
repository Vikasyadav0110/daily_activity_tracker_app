import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, List, Switch, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@store/settingsStore';
import { SUPPORTED_LANGUAGES } from '@i18n/index';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  bn: 'বাংলা',
};

export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, theme: appTheme, notificationEnabled, setLanguage, setTheme, setNotificationEnabled } =
    useSettingsStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        {t('settings.title')}
      </Text>

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

      <View style={styles.footer}>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
          {t('settings.version', { version: '1.0.0' })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', padding: 20, paddingBottom: 8 },
  footer: { alignItems: 'center', padding: 24 },
});
