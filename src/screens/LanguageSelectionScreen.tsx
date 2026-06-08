import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '@store/settingsStore';
import type { RootNavigationProp } from '@navigation/types';

interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳' },
  { code: 'en', nativeName: 'English', englishName: 'English', flag: '🌐' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', flag: '🇮🇳' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', flag: '🇮🇳' },
];

export function LanguageSelectionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<RootNavigationProp>();
  const { setLanguage, language: selectedLanguage } = useSettingsStore();

  const handleSelect = (code: string) => {
    setLanguage(code);
    navigation.navigate('OnboardingQuiz');
  };

  const renderItem = ({ item }: { item: LanguageOption }) => {
    const isSelected = item.code === selectedLanguage;
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item.code)}
        style={[
          styles.optionCard,
          {
            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        accessibilityLabel={`${item.nativeName}, ${item.englishName}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        testID={`language-option-${item.code}`}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text
          style={[
            styles.nativeName,
            { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
          ]}
        >
          {item.nativeName}
        </Text>
        <Text
          style={[
            styles.englishName,
            { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant },
          ]}
        >
          {item.englishName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('language.select_title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('language.select_subtitle')}
        </Text>
      </View>
      <FlatList
        data={LANGUAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionCard: {
    flex: 0.48,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    minHeight: 110,
    justifyContent: 'center',
  },
  flag: {
    fontSize: 28,
  },
  nativeName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  englishName: {
    fontSize: 12,
    textAlign: 'center',
  },
});
