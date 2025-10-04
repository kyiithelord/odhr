import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle, View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function PrimaryButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
}: Props) {
  const { containerStyle, labelStyle } = getStylesFor(variant, size, disabled);

  return (
    <TouchableOpacity
      style={[containerStyle, fullWidth && { alignSelf: 'stretch' }, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      <View style={styles.contentRow}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        {loading ? (
          <ActivityIndicator size="small" color={labelStyle.color as string} />
        ) : (
          <Text style={[labelStyle, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
    </TouchableOpacity>
  );
}

function getStylesFor(variant: ButtonVariant, size: ButtonSize, disabled: boolean) {
  const paddingY = size === 'sm' ? theme.spacing(2.5) : size === 'lg' ? theme.spacing(4) : theme.spacing(3);
  const paddingX = size === 'sm' ? theme.spacing(3) : size === 'lg' ? theme.spacing(5) : theme.spacing(4);
  const fontSize = size === 'sm' ? theme.typography.fontSizes.sm : size === 'lg' ? theme.typography.fontSizes.lg : theme.typography.fontSizes.md;

  const base: ViewStyle = {
    paddingVertical: paddingY,
    paddingHorizontal: paddingX,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing(2),
  } as any; // gap is supported in RN New Architecture; safe fallback below

  let bg = theme.colors.primary;
  let borderColor = 'transparent';
  let labelColor = theme.colors.onPrimary;

  if (variant === 'secondary') {
    bg = theme.colors.primaryMuted;
    labelColor = theme.colors.text;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    borderColor = theme.colors.border;
    labelColor = theme.colors.text;
    (base as any).borderWidth = 1;
  } else if (variant === 'danger') {
    bg = theme.colors.error;
    labelColor = theme.colors.onPrimary;
  }

  if (disabled) {
    bg = theme.colors.disabledBg;
    labelColor = theme.colors.disabledText;
  }

  const containerStyle: ViewStyle = {
    ...base,
    backgroundColor: bg,
    borderColor,
  };

  const labelStyle: TextStyle = {
    color: labelColor,
    fontSize,
    fontWeight: theme.typography.fontWeights.medium as any,
  };

  return { containerStyle, labelStyle };
}

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: theme.spacing(1),
  },
});
