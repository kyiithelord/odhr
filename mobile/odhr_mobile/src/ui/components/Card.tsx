import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../themeProvider';

export type CardProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  radius?: 'sm' | 'md' | 'lg' | 'xl';
};

export function Card({ children, style, padded = true, elevated = true, radius = 'lg' }: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.radius[radius],
    borderWidth: 1,
    borderColor: theme.colors.border,
  } as any;

  const padding = padded ? { padding: theme.spacing(4) } : null;
  const elev = elevated
    ? ({ ...(theme.shadow.elev2?.android || {}), ...(theme.shadow.elev2?.ios || {}) } as any)
    : null;

  return <View style={[base, elev, padding as any, style]}>{children}</View>;
}

const styles = StyleSheet.create({});
