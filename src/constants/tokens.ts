/**
 * 별따먹자 design tokens (dark theme).
 *
 * Single source of truth for values that can't take a `className` — e.g.
 * `TextInput` placeholderTextColor, StatusBar style, React Navigation theme.
 * Mirrors the CSS variables in src/global.css; keep the two in sync.
 */

export const palette = {
  background: '#060A19',
  surface: '#18181B',
  field: '#1E2230',
  fieldDark: '#131724',
  primary: '#FFD457',
  primarySubtle: '#FAEECB',
  onPrimary: '#694800',
  foreground: '#FFFFFF',
  ink: '#111111',
  muted: '#A4A4A4',
  tabInactive: '#505050',
  bodyMuted: '#82848C',
  disabled: '#3F4250',
  popupButton: '#34394B',
  popupButtonText: '#A5A7AD',
  recoPanel: '#181F42',
  recoButton: '#0C1033',
  success: '#2FA96B',
  error: '#FF6B5E',
  info: '#2BAEFF',
} as const;

/** Figma: title Bold 24 · subheading Bold 22 · body Medium 16 · chip Regular 14. */
export const typography = {
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subheading: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  chip: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
} as const;

/** Figma: margin 20 · gutter 16 · status bar 44 · bottom 82 (nav 56 + safe 26). */
export const layout = {
  screenMargin: 20,
  gutter: 16,
  statusBar: 44,
  navBar: 56,
  safeBottom: 26,
} as const;

export const radius = {
  pill: 9999,
  card: 20,
} as const;

export type PaletteColor = keyof typeof palette;
