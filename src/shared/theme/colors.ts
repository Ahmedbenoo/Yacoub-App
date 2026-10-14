export const colors = {
  light: {
    primary: '#0D9488',
    primaryLight: '#14B8A6',
    secondary: '#3B82F6',
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
    },
    surface: {
      card: '#FFFFFF',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      inverse: '#FFFFFF',
      muted: '#94A3B8',
    },
    border: '#E2E8F0',
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  dark: {
    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    secondary: '#60A5FA',
    background: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
    },
    surface: {
      card: '#1E293B',
      elevated: '#334155',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      inverse: '#0F172A',
      muted: '#64748B',
    },
    border: '#334155',
    status: {
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },
} as const;

export type ColorScheme = keyof typeof colors;
