import { I18nManager, Platform, type TextStyle, type ViewStyle } from 'react-native';

import { useLocaleStore } from '@/shared/stores';

export function nativeLayoutMatchesLocale(isRtl: boolean): boolean {
  return I18nManager.isRTL === isRtl;
}

/** Paragraph start: right in Arabic, left in English — without double-flipping on Android. */
export function getStartTextAlign(isRtl: boolean, centered = false): NonNullable<TextStyle['textAlign']> {
  if (centered) return 'center';
  if (nativeLayoutMatchesLocale(isRtl)) return 'left';
  return isRtl ? 'right' : 'left';
}

export function getRowLayoutStyle(isRtl: boolean): ViewStyle {
  if (Platform.OS === 'web') {
    return { direction: isRtl ? 'rtl' : 'ltr', flexDirection: 'row' };
  }

  if (nativeLayoutMatchesLocale(isRtl)) {
    return { flexDirection: 'row' };
  }

  return { flexDirection: isRtl ? 'row-reverse' : 'row' };
}

export function useLayoutDirection() {
  const isRtl = useLocaleStore((s) => s.isRtl);
  const direction: ViewStyle['direction'] = isRtl ? 'rtl' : 'ltr';
  const matchesNative = nativeLayoutMatchesLocale(isRtl);

  return {
    isRtl,
    direction,
    rowStyle: getRowLayoutStyle(isRtl),
    alignInlineEnd: { alignSelf: matchesNative ? 'flex-end' : isRtl ? 'flex-start' : 'flex-end' } satisfies ViewStyle,
    alignInlineStart: { alignSelf: matchesNative ? 'flex-start' : isRtl ? 'flex-end' : 'flex-start' } satisfies ViewStyle,
    backIconName: isRtl ? ('chevronRight' as const) : ('back' as const),
    forwardIconName: isRtl ? ('chevronLeft' as const) : ('chevronRight' as const),
  };
}
