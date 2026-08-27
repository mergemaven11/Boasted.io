export const colors = {
  // BragStack product palette — no warm/brown accent drift.
  background: '#070B14',
  sidebar: '#0B1020',
  surface: '#0D1526',
  surfaceElevated: '#131E33',
  border: 'rgba(166, 220, 255, 0.16)',
  text: '#F8FAFC',
  muted: '#A7B4C9',
  mutedStrong: '#7F90AA',
  primary: '#A6DCFF',
  primarySoft: '#D8F1FF',
  secondary: '#AD91FF',
  cyan: '#69E4F6',
  danger: '#FFB0B0',

  // Canonical identity aliases retained for shared components.
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
    notification: colors.secondary,
  },
};
