import type { ColorValue } from 'react-native';
import { Platform } from 'react-native';

import { Icon, type AppIconName } from '@/shared/components/ui/Icon';

/** Shared bottom tab bar dimensions — keep admin/doctor/patient identical. */
export const TAB_BAR_METRICS = {
  iconSize: 22,
  labelFontSize: 11,
  labelLineHeight: 14,
  labelMarginTop: 4,
  topPadding: 8,
  /** Minimum touch target for icon + label block. */
  contentHeight: 48,
  horizontalPadding: 12,
  /** Minimum inset when the device reports zero (web / some Android). */
  minBottomInset: Platform.select({ web: 10, android: 12, default: 8 }) ?? 8,
  webBarHeight: 66,
} as const;

export function createTabBarIcon(name: AppIconName) {
  return ({ color }: { color: ColorValue; size?: number }) => (
    <Icon name={name} size={TAB_BAR_METRICS.iconSize} color={String(color)} />
  );
}

export function useTabBarScreenOptions() {
  return {
    headerShown: false as const,
    tabBarShowLabel: false as const,
  };
}
