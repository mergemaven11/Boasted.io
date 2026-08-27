export const colors = {
  // Authenticated app/admin palette — BragStack Brand Guide
  background: '#090909',
  sidebar: '#0B0B0B',
  surface: '#111111',
  surfaceElevated: '#121212',
  border: 'rgba(247, 244, 238, 0.12)',
  text: '#F7F4EE',
  muted: '#AAA39A',
  mutedStrong: '#817A73',
  primary: '#FFB184',
  primarySoft: '#FFD2B8',
  danger: '#FFB0B0',

  // Canonical brand/marketing accents retained for the official logo and
  // occasional identity moments, not as the authenticated app's main UI color.
  brandBackground: '#070B14',
  brandSurface: '#0D1526',
  brandSurfaceLight: '#131E33',
  brandText: '#F8FAFC',
  brandMuted: '#A7B4C9',
  brandBlue: '#A6DCFF',
  brandPurple: '#AD91FF',
  brandCyan: '#69E4F6',

  success: '#86E3B2',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 28,
  pill: 999,
};

export const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.sidebar,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};
