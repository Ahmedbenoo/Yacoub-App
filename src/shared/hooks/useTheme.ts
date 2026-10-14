import { useColorScheme as useSystemColorScheme } from 'react-native';

import { colors, type ColorScheme } from '@/shared/theme/colors';
import { useThemeStore } from '@/shared/stores';
import { ThemeMode } from '@/shared/types/enums';

export function useResolvedColorScheme(): ColorScheme {
  const systemScheme = useSystemColorScheme();
  const mode = useThemeStore((s) => s.mode);

  if (mode === ThemeMode.DARK) return 'dark';
  if (mode === ThemeMode.LIGHT) return 'light';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function useThemeColors() {
  const scheme = useResolvedColorScheme();
  return colors[scheme];
}
