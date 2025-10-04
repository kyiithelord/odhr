import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

export function InlineAlert({ text, style }: { text: string; style?: ViewStyle }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.txt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: '#FFF5F5',
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
  },
  txt: { color: theme.colors.danger },
});
