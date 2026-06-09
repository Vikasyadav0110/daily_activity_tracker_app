import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmail, signInWithGoogle } from '@services/supabase/authService';
import { hasMigratedToCloud, migrateLocalDataToCloud } from '@services/supabase/migrationService';
import { useAuthStore } from '@store/authStore';
import { palette } from '@constants/colors';
import type { AuthStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'> };

export function SignInScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setUser, setLocalOnly, setHasMigrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState('');

  async function handlePostLogin(userId: string) {
    const alreadyMigrated = await hasMigratedToCloud(userId);
    if (!alreadyMigrated) {
      setMigrating(true);
      await migrateLocalDataToCloud(userId, (p) => {
        setMigrationStep(`${p.step}: ${p.current}/${p.total}`);
      });
      setMigrating(false);
      setHasMigrated(true);
    } else {
      setHasMigrated(true);
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('auth.error'), t('auth.fill_all_fields'));
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithEmail(email.trim(), password);
      setUser(user);
      await handlePostLogin(user.id);
    } catch (e: unknown) {
      Alert.alert(t('auth.error'), e instanceof Error ? e.message : t('auth.sign_in_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      setUser(user);
      await handlePostLogin(user.id);
    } catch (e: unknown) {
      Alert.alert(t('auth.error'), e instanceof Error ? e.message : t('auth.google_failed'));
    } finally {
      setLoading(false);
    }
  }

  function handleContinueWithoutAccount() {
    setLocalOnly(true);
  }

  if (migrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.migratingText}>{t('auth.migrating')}</Text>
        <Text style={styles.migrationStep}>{migrationStep}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>
          {t('auth.welcome_back')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('auth.sign_in_subtitle')}
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

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
          <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
        </TouchableOpacity>

        <Button
          mode="contained"
          onPress={handleEmailSignIn}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('auth.sign_in')}
        </Button>

        <Button
          mode="outlined"
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="google"
        >
          {t('auth.sign_in_google')}
        </Button>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          mode="text"
          onPress={handleContinueWithoutAccount}
          disabled={loading}
          style={styles.skipButton}
        >
          {t('auth.continue_without_account')}
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpRow}>
          <Text style={styles.signUpPrompt}>
            {t('auth.no_account')}{' '}
            <Text style={styles.signUpLink}>{t('auth.sign_up')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8, color: palette.primary },
  subtitle: { color: palette.grey600, marginBottom: 32 },
  input: { marginBottom: 16 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: palette.primary, fontSize: 13 },
  button: { marginBottom: 12 },
  buttonContent: { height: 48 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.grey300 },
  dividerText: { marginHorizontal: 12, color: palette.grey500, fontSize: 13 },
  skipButton: { marginBottom: 8 },
  signUpRow: { alignItems: 'center', marginTop: 8 },
  signUpPrompt: { color: palette.grey600, fontSize: 14 },
  signUpLink: { color: palette.primary, fontWeight: '600' },
  migratingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: palette.primary },
  migrationStep: { marginTop: 8, fontSize: 13, color: palette.grey600 },
});
