import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/common/BottomSheet';
import { Button } from '@components/common/Button';
import { updateActivity, archiveActivity } from '@services/db/activitiesRepo';
import { useActivitiesStore } from '@store/activitiesStore';
import { CATEGORIES, ACTIVITY_EMOJIS } from '@constants/categories';
import type { Activity } from '@services/db/activitiesRepo';

interface Props {
  activity: Activity | null;
  onDismiss: () => void;
  onSaved: () => void;
}

export function ActivityEditModal({ activity, onDismiss, onSaved }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setActivities } = useActivitiesStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [category, setCategory] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setIcon(activity.icon);
      setCategory(activity.category);
      setNameError('');
    }
  }, [activity]);

  const handleDismiss = useCallback(() => {
    setNameError('');
    onDismiss();
  }, [onDismiss]);

  const handleSave = async () => {
    if (!activity) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('activities.create.name_error_empty'));
      return;
    }
    if (trimmed.length > 50) {
      setNameError(t('activities.create.name_error_too_long'));
      return;
    }
    setLoading(true);
    try {
      await updateActivity(activity.id, { name: trimmed, icon, category });
      onSaved();
      onDismiss();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = () => {
    if (!activity) return;
    Alert.alert(
      t('activities.edit.archive_title'),
      t('activities.edit.archive_confirm', { name: activity.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('activities.edit.archive_btn'),
          style: 'destructive',
          onPress: async () => {
            await archiveActivity(activity.id);
            onSaved();
            onDismiss();
          },
        },
      ]
    );
  };

  if (!activity) return null;

  return (
    <BottomSheet visible={!!activity} onDismiss={handleDismiss} snapPoint="85%">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('activities.edit.title')}
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
            style={[styles.input, { color: theme.colors.onSurface }]}
            value={name}
            onChangeText={(text) => {
              if (text.length <= 50) {
                setName(text);
                if (nameError) setNameError('');
              }
            }}
            placeholder={t('activities.create.name_placeholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            maxLength={50}
          />
          <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
            {name.length}/50
          </Text>
        </View>
        {nameError ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{nameError}</Text>
        ) : null}

        {/* Icon picker */}
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {t('activities.create.icon_label')}
        </Text>
        <View style={styles.iconGrid}>
          {ACTIVITY_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => setIcon(emoji)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor:
                    icon === emoji
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                  borderColor:
                    icon === emoji ? theme.colors.primary : 'transparent',
                  borderWidth: icon === emoji ? 2 : 0,
                },
              ]}
            >
              <Text style={styles.iconEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {t('activities.create.category_label')}
        </Text>
        <View style={styles.categoryRow}>
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
                  borderWidth: category === cat.key ? 1.5 : 0,
                },
              ]}
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
                    fontWeight: category === cat.key ? '700' : '500',
                  },
                ]}
              >
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={loading ? t('common.loading') : t('activities.edit.save_btn')}
          onPress={handleSave}
          disabled={loading || !name.trim() || !category}
          style={styles.saveBtn}
        />

        <TouchableOpacity onPress={handleArchive} style={styles.archiveBtn}>
          <Text style={[styles.archiveText, { color: theme.colors.error }]}>
            {t('activities.edit.archive_btn')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  charCount: { fontSize: 12, marginLeft: 8 },
  error: { fontSize: 12, marginTop: 4 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 22 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontSize: 13 },
  saveBtn: { marginTop: 24 },
  archiveBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  archiveText: { fontSize: 14, fontWeight: '600' },
});
