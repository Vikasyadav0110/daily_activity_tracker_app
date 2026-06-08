import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

interface Props {
  label: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  mode = 'contained',
  disabled = false,
  loading = false,
  style,
  labelStyle,
  icon,
  testID,
}: Props) {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      style={[styles.button, style]}
      labelStyle={[styles.label, labelStyle]}
      icon={icon}
      testID={testID}
      contentStyle={styles.content}
    >
      {label}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    minHeight: 48,
  },
  content: {
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
