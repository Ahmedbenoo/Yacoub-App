import { Platform, type TextStyle } from 'react-native';
import * as Font from 'expo-font';

type FontWeight = NonNullable<TextStyle['fontWeight']>;
type LoadedWeight = 400 | 500 | 600 | 700;

const CAIRO: Record<LoadedWeight, string> = {
  400: 'Cairo-Regular',
  500: 'Cairo-Medium',
  600: 'Cairo-SemiBold',
  700: 'Cairo-Bold',
};

const INTER: Record<LoadedWeight, string> = {
  400: 'Inter-Regular',
  500: 'Inter-Medium',
  600: 'Inter-SemiBold',
  700: 'Inter-Bold',
};

function toLoadedWeight(fontWeight?: FontWeight | number): LoadedWeight {
  const value = String(fontWeight ?? '400');
  if (value === '700' || value === 'bold' || value === '800' || value === '900') return 700;
  if (value === '600' || value === 'semibold') return 600;
  if (value === '500' || value === 'medium') return 500;
  return 400;
}

function weightFromClassName(className?: string): FontWeight | undefined {
  if (!className) return undefined;
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return '700';
  if (/\bfont-semibold\b/.test(className)) return '600';
  if (/\bfont-medium\b/.test(className)) return '500';
  return undefined;
}

export function resolveFontFamily(isRtl: boolean, fontWeight?: FontWeight | number): string {
  const weight = toLoadedWeight(fontWeight);
  return isRtl ? CAIRO[weight] : INTER[weight];
}

/**
 * Android synthesizes missing weights from a custom font and that breaks
 * Arabic glyph joining. Pick the exact TTF via fontFamily and never ask
 * the system to fake a weight.
 */
export function getTypedFontStyle(
  isRtl: boolean,
  fontWeight?: FontWeight | number,
  className?: string,
): TextStyle {
  const weight = weightFromClassName(className) ?? fontWeight;
  const family = resolveFontFamily(isRtl, weight);
  const fontLoaded = Platform.OS === 'web' || Font.isLoaded(family);

  return {
    fontFamily: fontLoaded ? family : undefined,
    fontWeight: fontLoaded && Platform.OS === 'android' ? 'normal' : (toLoadedWeight(weight).toString() as FontWeight),
    includeFontPadding: false,
    letterSpacing: 0,
  };
}
