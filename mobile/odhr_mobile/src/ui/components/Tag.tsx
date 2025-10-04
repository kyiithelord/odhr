import React from 'react';
import { Text, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../themeProvider';

export type TagVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent';
export type TagSize = 'sm' | 'md';

export type TagProps = {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
};

export function Tag({ label, variant = 'default', size = 'md', style, textStyle, leftIcon }: TagProps) {
  const theme = useTheme();

  const px = size === 'sm' ? theme.spacing(2) : theme.spacing(3);
  const py = size === 'sm' ? theme.spacing(1) : theme.spacing(2);
  const fs = size === 'sm' ? theme.typography.fontSizes.xs : theme.typography.fontSizes.sm;

  let bg = theme.colors.primaryMuted;
  let color = theme.colors.text;
  if (variant === 'success') {
    bg = '#D1FAE5';
    color = '#065F46';
  } else if (variant === 'warning') {
    bg = '#FEF3C7';
    color = '#92400E';
  } else if (variant === 'danger') {
    bg = '#FEE2E2';
    color = '#991B1B';
  } else if (variant === 'accent') {
    bg = '#FFEDD5';
    color = '#7C2D12';
  }

  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    backgroundColor: bg,
    paddingHorizontal: px,
    paddingVertical: py,
  } as any;

  const labelStyle: TextStyle = {
    color,
    fontSize: fs,
    fontWeight: theme.typography.fontWeights.medium as any,
  };

  return (
    <View style={[container, style]}>
      {leftIcon ? <View style={{ marginRight: theme.spacing(1) }}>{leftIcon}</View> : null}
      <Text style={[labelStyle, textStyle]}>{label}</Text>
    </View>
  );
}
