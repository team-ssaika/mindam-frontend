/**
 * Design tokens — tone "A · 소프트 퍼플".
 * White canvas, purple accent, lavender surfaces, grey typography hierarchy.
 */

export const colors = {
  // text
  ink: '#000000',
  body: '#333840',
  muted: '#767676',
  faint: '#BDBDBD',
  // surfaces
  canvas: '#ffffff',
  soft: '#FAFAFC',
  soft2: '#F0F0F5',
  hairline: '#ECECF2',
  // brand (purple)
  brand: '#6C63FF',
  brandActive: '#5A52E8',
  brandSoft: '#F0EEFF',
  accent: '#6C63FF',
  accentSoft: '#ECE9FF',
  accentActive: '#5A52E8',
  // buttons
  buttonDisabled: '#E1E1F0',
  buttonDisabledText: '#FFFFFF',
  // legacy aliases (map to purple system)
  coral: '#6C63FF',
  forest: '#1F6B32',
  cream: '#F5F0FF',
  peach: '#C4BFFF',
  mint: '#DCEFE1',
  yellow: '#F4D35E',
  mustard: '#D9A441',
  // misc
  white: '#ffffff',
  black: '#000000',
  danger: '#E25353',
} as const;

export type ColorToken = keyof typeof colors;

/** Report status palette (접수 대기 / 처리중 / 처리 완료). */
export const statusColors = {
  wait: { bg: '#F0F0F5', fg: '#767676', dot: '#BDBDBD', label: '접수 대기' },
  prog: { bg: '#FBEccb', fg: '#8A6612', dot: '#D9A441', label: '처리중' },
  done: { bg: '#DCEFE1', fg: '#1F6B32', dot: '#2E8B46', label: '처리 완료' },
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
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  fab: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#000',
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
