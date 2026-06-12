/**
 * Design tokens — tone "B · 스카이 블루" (민원인 홈 기준).
 */

export const colors = {
  // text
  ink: '#050505',
  body: '#2F2F2F',
  muted: '#777777',
  faint: '#B3B3B3',
  // surfaces
  canvas: '#ffffff',
  soft: '#FAFAFA',
  soft2: '#F5F5F5',
  hairline: '#F1F1F1',
  // brand (sky)
  brand: '#7EC8F7',
  brandActive: '#55B5F0',
  brandSoft: 'rgba(126, 200, 247, 0.22)',
  accent: '#7EC8F7',
  accentSoft: 'rgba(126, 200, 247, 0.22)',
  accentActive: '#55B5F0',
  // buttons
  buttonDisabled: '#D4D4D4',
  buttonDisabledText: '#FFFFFF',
  // supporting palette
  coral: '#7EC8F7',
  forest: '#3D8B62',
  cream: '#F0F9FF',
  peach: '#55B5F0',
  mint: '#D8EDE4',
  yellow: '#B8E1F6',
  mustard: '#7EC8F7',
  // misc
  white: '#ffffff',
  black: '#000000',
  danger: '#D95E5E',
} as const;

export type ColorToken = keyof typeof colors;

/** Report status palette — gray wait, amber prog, soft green done. */
export const statusColors = {
  wait: { bg: '#E8E8E8', fg: '#4A4F63', dot: '#72789A', label: '접수 대기' },
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
  black: 'Pretendard-Black',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 18,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  float: {
    shadowColor: '#000000',
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
