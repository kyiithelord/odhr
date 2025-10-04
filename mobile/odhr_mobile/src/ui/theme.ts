export const theme = {
  colors: {
    bg: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    card: '#F9FAFB',
    danger: '#B00020',
  },
  spacing: (n: number) => 4 * n,
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
  },
  shadow: {
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
  },
};
