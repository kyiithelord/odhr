import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Percent = `${number}%`;

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | Percent; style?: ViewStyle }) {
  return <View style={[styles.base, { height, width } as ViewStyle, style]} />;
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: theme.spacing(3) }}>
          <Skeleton height={16} width="80%" />
          <Skeleton height={12} width="60%" style={{ marginTop: theme.spacing(1) }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
});
