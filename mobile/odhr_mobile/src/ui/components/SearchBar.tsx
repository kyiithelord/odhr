import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../themeProvider';

type Props = TextInputProps & {
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  elevated?: boolean;
};

export function SearchBar({ style, leftIcon, rightIcon, onClear, elevated = true, value, onChangeText, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  const showClear = !!value && value.length > 0 && !!onChangeText;

  const wrapperStyles: ViewStyle[] = [
    {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius['2xl'],
      backgroundColor: theme.colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing(3),
    },
    elevated && (focused ? getElevFocused(theme) : getElev(theme)),
    focused && { borderColor: theme.colors.focusRing },
    style as any,
  ];

  return (
    <View style={wrapperStyles}>
      {leftIcon ? <View style={{ marginRight: theme.spacing(2) }}>{leftIcon}</View> : null}
      <TextInput
        placeholder="Search"
        placeholderTextColor={theme.colors.muted}
        style={{ flex: 1, paddingVertical: theme.spacing(3), color: theme.colors.text }}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {showClear ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChangeText && onChangeText('');
            onClear && onClear();
          }}
          style={{
            marginLeft: theme.spacing(2),
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primaryMuted,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 16, lineHeight: 16 }}>×</Text>
        </TouchableOpacity>
      ) : rightIcon ? (
        <View style={{ marginRight: theme.spacing(2) }}>{rightIcon}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Only static styles remain here
});

function getElev(theme: ReturnType<typeof useTheme>) {
  return { ...(theme.shadow.elev1?.android || {}), ...(theme.shadow.elev1?.ios || {}) } as any;
}

function getElevFocused(theme: ReturnType<typeof useTheme>) {
  return { ...(theme.shadow.elev2?.android || {}), ...(theme.shadow.elev2?.ios || {}) } as any;
}
