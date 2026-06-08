import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export function ProgressScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('progress.title')}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          {t('progress.no_data')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
});
