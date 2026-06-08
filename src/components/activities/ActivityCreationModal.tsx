import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, useTheme, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/common/BottomSheet';
import { Button } from '@components/common/Button';
import { createActivity } from '@services/db/activitiesRepo';
import { useActivitiesStore } from '@store/activitiesStore';
import { CATEGORIES, ACTIVITY_EMOJIS, DAYS_OF_WEEK } from '@constants/categories';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

type Frequency = 'daily' | 'weekly';

export function ActivityCreationModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { addActivity } = useActivitiesStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setIcon('⚡');
    setCategory('');
    setFrequency('daily');
    setSelectedDays([]);
    setNameError('');
  }, []);

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  const handleNameChange = (text: string) => {
    if (text.length <= 50) {
      setName(text);
      if (nameError) setNameError('');
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const buildFrequencyString = (): string => {
    if (frequency === 'daily') return 'daily';
    if (selectedDays.length === 0) return 'daily';
    return `weekly:${selectedDays.sort().join(',')}`;
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError(t('activities.create.name_error_empty'));
      return false;
    }
    if (name.trim().length > 50) {
      setNameError(t('activities.create.name_error_too_long'));
      return false;
    }
    if (!category) {
      setSnackMessage('Please select a category');
      setSnackVisible(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const activity = await createActivity({
        name: name.trim(),
        icon,
        category,
        frequency: buildFrequencyString(),
      });
      addActivity(activity);
      handleDismiss();
    } catch {
      setSnackMessage(t('activities.check_off.error'));
      setSnackVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const DAY_LABELS = DAYS_OF_WEEK.map((d) => t(`activities.days.${d}`));

  return (
    <>
      <BottomSheet visible={visible} onDismiss={handleDismiss}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            {t('activities.create.title')}
          </Text>

          {/* Name */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            {t('activities.create.name_label')}
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: nameError ? theme.colors.error : theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          >
            <TextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder={t('activities.create.name_placeholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={[styles.input, { color: theme.colors.onSurface }]}
              maxLength={50}
              testID="activity-name-input"
              autoCapitalize="words"
              returnKeyType="done"
            />
            <Text style={[styles.charCount, { color: name.length >= 45 ? theme.colors.error : theme.colors.onSurfaceVariant }]}>
              {t('activities.create.char_count', { count: name.length })}
            </Text>
          </View>
          {nameError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{nameError}</Text>
          ) : null}

          {/* Icon Picker */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            {t('activities.create.icon_label')}
          </Text>
          <FlatList
            data={ACTIVITY_EMOJIS}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setIcon(item)}
                style={[
                  styles.emojiButton,
                  {
                    backgroundColor: icon === item ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor: icon === item ? theme.colors.primary : 'transparent',
                  },
                ]}
                testID={`emoji-${item}`}
              >
                <Text style={styles.emoji}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            numColumns={8}
            scrollEnabled={false}
            columnWrapperStyle={styles.emojiRow}
          />

          {/* Category */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            {t('activities.create.category_label')}
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      category === cat.key
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceVariant,
                    borderColor:
                      category === cat.key ? theme.colors.primary : 'transparent',
                  },
                ]}
                testID={`category-${cat.key}`}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color:
                        category === cat.key
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Frequency */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            {t('activities.create.frequency_label')}
          </Text>
          <View style={styles.frequencyRow}>
            {(['daily', 'weekly'] as Frequency[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFrequency(f)}
                style={[
                  styles.frequencyChip,
                  {
                    backgroundColor:
                      frequency === f
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceVariant,
                    borderColor: frequency === f ? theme.colors.primary : 'transparent',
                  },
                ]}
                testID={`frequency-${f}`}
              >
                <Text
                  style={[
                    styles.frequencyLabel,
                    {
                      color:
                        frequency === f
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t(`activities.create.frequency_${f}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === 'weekly' && (
            <>
              <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('activities.create.frequency_select_days')}
              </Text>
              <View style={styles.daysRow}>
                {DAY_LABELS.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => toggleDay(idx)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selectedDays.includes(idx)
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                    testID={`day-${idx}`}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: selectedDays.includes(idx)
                            ? theme.colors.onPrimary
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.buttonRow}>
            <Button
              label={t('activities.create.cancel')}
              onPress={handleDismiss}
              mode="outlined"
              style={styles.cancelButton}
              testID="cancel-button"
            />
            <Button
              label={t('activities.create.save')}
              onPress={handleSave}
              loading={loading}
              disabled={!name.trim() || !category}
              style={styles.saveButton}
              testID="save-activity-button"
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
      >
        {snackMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  subLabel: { fontSize: 13, marginBottom: 8, marginTop: 8 },
  inputWrapper: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  charCount: { fontSize: 11 },
  errorText: { fontSize: 12, marginTop: 4 },
  emojiRow: { justifyContent: 'flex-start', gap: 4, marginBottom: 4 },
  emojiButton: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  emoji: { fontSize: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1.5 },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontSize: 13, fontWeight: '500' },
  frequencyRow: { flexDirection: 'row', gap: 10 },
  frequencyChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  frequencyLabel: { fontSize: 15, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
});
