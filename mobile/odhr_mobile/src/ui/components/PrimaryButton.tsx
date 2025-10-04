import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

export function PrimaryButton({ title, onPress, style, textStyle }: { title: string; onPress?: (e: GestureResponderEvent) => void; style?: ViewStyle; textStyle?: TextStyle }) {
  return (
    <TouchableOpacity style={[styles.btn, style]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.txt, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  txt: {
    color: theme.colors.primaryText,
    fontWeight: '600',
    fontSize: 16,
  },
});
