/**
 * Design tokens — tone "A · 소프트 퍼플".
 * Lavender-tinted neutrals + #6C63FF brand family.
 */

export const colors = {
  // text (purple-gray undertone)
  ink: '#1C1B26',
  body: '#3F3D50',
  muted: '#7B7894',
  faint: '#B3B0C4',
  // surfaces (lavender tint)
  canvas: '#ffffff',
  soft: '#F9F8FD',
  soft2: '#EEECF8',
  hairline: '#E6E4F2',
  // brand (purple)
  brand: '#6C63FF',
  brandActive: '#5A52E8',
  brandSoft: '#EEEAFF',
  accent: '#6C63FF',
  accentSoft: '#E8E4FF',
  accentActive: '#5A52E8',
  // buttons
  buttonDisabled: '#DDD9F0',
  buttonDisabledText: '#FFFFFF',
  // supporting palette (harmonized with brand)
  coral: '#6C63FF',
  forest: '#3D8B62',
  cream: '#F5F2FF',
  peach: '#A89FFF',
  mint: '#D8EDE4',
  yellow: '#D4CCFF',
  mustard: '#8B83F0',
  // misc
  white: '#ffffff',
  black: '#000000',
  danger: '#E45B5B',
} as const;

export type ColorToken = keyof typeof colors;

/** Report status palette — gray wait, amber prog, soft green done. */
export const statusColors = {
  wait: { bg: '#DDE1EF', fg: '#4A4F63', dot: '#72789A', label: '접수 대기' },
  prog: { bg: '#FEF3C7', fg: '#92400E', dot: '#D97706', label: '처리중' },
  done: { bg: '#E6F4EC', fg: '#2F6B4A', dot: '#3D8B62', label: '처리 완료' },
} as const;

export type StatusKey = keyof typeof statusColors;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  '2xl': 28,
  pill: 999,
} as const;

/** 4px spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

/** Horizontal screen padding used across flows. */
export const layout = {
  screenPadding: 20,
} as const;

export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export type FontWeightToken = keyof typeof fonts;

export function fontByWeight(weight: 400 | 500 | 600 | 700): string {
  switch (weight) {
    case 700:
      return fonts.bold;
    case 600:
      return fonts.semibold;
    case 500:
      return fonts.medium;
    default:
      return fonts.regular;
  }
}

export const shadow = {
  card: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#3F3D50',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  fab: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#3F3D50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, letterSpacing: -0.3 },
  section: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
  mono: { fontFamily: 'ui-monospace', fontSize: 12.5, letterSpacing: 0.2 },
} as const;
