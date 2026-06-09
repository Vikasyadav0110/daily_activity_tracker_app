import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resetPassword } from '@services/supabase/authService';
import { palette } from '@constants/colors';
import type { AuthStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert(t('auth.error'), t('auth.fill_all_fields'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: unknown) {
      Alert.alert(t('auth.error'), e instanceof Error ? e.message : t('auth.reset_failed'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>✉️</Text>
        <Text variant="headlineSmall" style={styles.title}>{t('auth.check_email')}</Text>
        <Text style={styles.subtitle}>{t('auth.reset_sent', { email })}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          {t('auth.back_to_sign_in')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>{t('auth.forgot_password')}</Text>
      <Text style={styles.subtitle}>{t('auth.reset_subtitle')}</Text>

      <TextInput
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleReset}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {t('auth.send_reset_link')}
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()} disabled={loading}>
        {t('auth.back_to_sign_in')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', marginBottom: 8, color: palette.primary },
  subtitle: { color: palette.grey600, marginBottom: 32, lineHeight: 22 },
  input: { marginBottom: 16 },
  button: { marginBottom: 12 },
  buttonContent: { height: 48 },
  successIcon: { fontSize: 48, marginBottom: 16 },
});
