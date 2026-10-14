/**
 * Mobile-first typography scale (iOS/Material-inspired).
 * Body stays at 16px for readability; headings are compact for small screens.
 */
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  titleLg: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  titleMd: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  titleSm: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const touchTarget = 44;
