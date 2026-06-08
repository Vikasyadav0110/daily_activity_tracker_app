import React from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Surface } from 'react-native-paper';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  testID?: string;
}

export function Card({ children, onPress, style, elevation = 1, testID }: Props) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} testID={testID} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        <Surface style={[styles.card, style]} elevation={elevation}>
          {children}
        </Surface>
      </Pressable>
    );
  }
  return (
    <Surface style={[styles.card, style]} elevation={elevation} testID={testID}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
});
