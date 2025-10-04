import React, { createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { themeLight, themeDark } from './theme';

export type ThemeType = typeof themeLight;

const ThemeContext = createContext<ThemeType>(themeLight);

export function ThemeProvider({ children, scheme }: { children: React.ReactNode; scheme?: ColorSchemeName }) {
  const systemScheme = useColorScheme();
  const current = useMemo(() => {
    const effective = scheme ?? systemScheme;
    return effective === 'dark' ? themeDark : themeLight;
  }, [scheme, systemScheme]);

  return <ThemeContext.Provider value={current}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
