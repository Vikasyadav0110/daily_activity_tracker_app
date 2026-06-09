import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signUpWithEmail } from '@services/supabase/authService';
import { migrateLocalDataToCloud } from '@services/supabase/migrationService';
import { useAuthStore } from '@store/authStore';
import { palette } from '@constants/colors';
import type { AuthStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };

export function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setUser, setLocalOnly, setHasMigrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('auth.error'), t('auth.fill_all_fields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.passwords_dont_match'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('auth.error'), t('auth.password_too_short'));
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email.trim(), password);
      setUser(user);
      // New account — migrate existing local data to cloud
      await migrateLocalDataToCloud(user.id);
      setHasMigrated(true);
    } catch (e: unknown) {
      Alert.alert(t('auth.error'), e instanceof Error ? e.message : t('auth.sign_up_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>
          {t('auth.create_account')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('auth.sign_up_subtitle')}
        </Text>

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
        <TextInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />
        <TextInput
          label={t('auth.confirm_password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('auth.create_account')}
        </Button>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          mode="text"
          onPress={() => setLocalOnly(true)}
          disabled={loading}
        >
          {t('auth.continue_without_account')}
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.signInRow}>
          <Text style={styles.signInPrompt}>
            {t('auth.have_account')}{' '}
            <Text style={styles.signInLink}>{t('auth.sign_in')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8, color: palette.primary },
  subtitle: { color: palette.grey600, marginBottom: 32 },
  input: { marginBottom: 16 },
  button: { marginBottom: 12, marginTop: 8 },
  buttonContent: { height: 48 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.grey300 },
  dividerText: { marginHorizontal: 12, color: palette.grey500, fontSize: 13 },
  signInRow: { alignItems: 'center', marginTop: 16 },
  signInPrompt: { color: palette.grey600, fontSize: 14 },
  signInLink: { color: palette.primary, fontWeight: '600' },
});
