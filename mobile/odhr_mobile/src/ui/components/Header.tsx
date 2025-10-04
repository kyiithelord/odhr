import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export function Header({ title, right, onRightPress, style }: { title: string; right?: string; onRightPress?: () => void; style?: ViewStyle }) {
  return (
    <View style={[styles.root, style]}>
      <Text style={styles.title}>{title}</Text>
      {right ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.8}>
          <Text style={styles.rightTxt}>{right}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  rightBtn: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  rightTxt: { color: theme.colors.primary, fontWeight: '600' },
});
