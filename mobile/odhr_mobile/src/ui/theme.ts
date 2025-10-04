export const theme = {
  // Color tokens
  colors: {
    // Base (kept for backward compatibility)
    bg: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    card: '#F9FAFB',
    danger: '#B00020',

    // Semantic additions
    primaryDark: '#1E40AF',
    primaryMuted: '#DBEAFE',
    primaryPressed: '#1D4ED8',
    accent: '#F59E0B', // Amber accent
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    elevated: '#FFFFFF',

    // On-color text (contrast pairs)
    onPrimary: '#FFFFFF',
    onAccent: '#1F2937',
    onSurface: '#111827',
    onMuted: '#374151',

    // States
    focusRing: '#93C5FD',
    disabledBg: '#E5E7EB',
    disabledText: '#9CA3AF',
  },

  // Spacing scale (4px baseline)
  spacing: (n: number) => 4 * n,

  // Radii scale
  radius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    '2xl': 999, // for pill shapes
  },

  // Typography tokens
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontWeights: {
      regular: '400' as const,
      medium: '600' as const,
      bold: '700' as const,
    },
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.3,
      relaxed: 1.5,
    },
  },

  // Elevation/shadow presets with iOS parity
  shadow: {
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    elev1: {
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      },
    },
    elev2: {
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    },
    elev3: {
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
    },
  },
};
