import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../themeProvider';

export type DividerProps = {
  style?: ViewStyle;
  inset?: number; // left/right inset for horizontal divider
  vertical?: boolean;
};

export function Divider({ style, inset = 0, vertical = false }: DividerProps) {
  const theme = useTheme();

  const base: ViewStyle = vertical
    ? {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing(1),
        marginHorizontal: inset,
      }
    : {
        height: 1,
        alignSelf: 'stretch',
        backgroundColor: theme.colors.border,
        marginHorizontal: inset,
        marginVertical: theme.spacing(2),
      };

  return <View style={[base, style]} />;
}
