import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { theme } from '../theme';

export function SearchBar({ style, ...props }: TextInputProps & { style?: ViewStyle }) {
  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        placeholder="Search"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
  },
  input: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    color: theme.colors.text,
  },
});
