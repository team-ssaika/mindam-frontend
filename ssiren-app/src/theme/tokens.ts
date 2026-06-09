/**
 * Design tokens — tone "B · 잉크 코랄" (ink + coral).
 * Ported from the ssaika-design design system (ds.jsx `SS`).
 * Single source of truth for color, radius, spacing, typography, and shadow.
 */

export const colors = {
  // text
  ink: '#181d26',
  body: '#333840',
  muted: '#6b7280',
  faint: '#9aa0aa',
  // surfaces
  canvas: '#ffffff',
  soft: '#f7f6f4',
  soft2: '#efedea',
  hairline: '#e7e4df',
  // brand (ink) + accent (coral)
  brand: '#181d26',
  brandActive: '#0d1218',
  brandSoft: '#f1ebe7',
  accent: '#aa2d00',
  accentSoft: '#f7ece7',
  accentActive: '#8a2400',
  // supporting palette
  coral: '#aa2d00',
  forest: '#0a2e0e',
  cream: '#f5e9d4',
  peach: '#fcab79',
  mint: '#a8d8c4',
  yellow: '#f4d35e',
  mustard: '#d9a441',
  // misc
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;

/** Report status palette (접수 대기 / 처리중 / 처리 완료). */
export const statusColors = {
  wait: { bg: '#eef0f3', fg: '#586070', dot: '#9297a0', label: '접수 대기' },
  prog: { bg: '#fbeccb', fg: '#8a6612', dot: '#d9a441', label: '처리중' },
  done: { bg: '#dcefe1', fg: '#1f6b32', dot: '#2e8b46', label: '처리 완료' },
} as const;

export type StatusKey = keyof typeof statusColors;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** 4px spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
} as const;

/**
 * Pretendard family names — must match the keys passed to `useFonts`.
 * RN custom fonts do not respond to numeric fontWeight, so the weight is
 * selected by swapping the family.
 */
export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export type FontWeightToken = keyof typeof fonts;

/** Map a CSS-ish weight number to the matching Pretendard family. */
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

/** RN shadows (iOS shadow* + Android elevation). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

/**
 * Typography presets — each returns an RN text style (family + size + spacing).
 * Line height is expressed in absolute px to match the design.
 */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 23, lineHeight: 31, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 23, letterSpacing: -0.3 },
  section: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, letterSpacing: -0.3 },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14.5, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
  mono: { fontFamily: 'ui-monospace', fontSize: 12.5, letterSpacing: 0.2 },
} as const;
