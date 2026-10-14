import { View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { light: string; dark: string }> = {
  default: { light: 'bg-slate-100', dark: 'bg-slate-700' },
  success: { light: 'bg-emerald-100', dark: 'bg-emerald-900/30' },
  warning: { light: 'bg-amber-100', dark: 'bg-amber-900/30' },
  error: { light: 'bg-red-100', dark: 'bg-red-900/30' },
  info: { light: 'bg-blue-100', dark: 'bg-blue-900/30' },
  purple: { light: 'bg-violet-100', dark: 'bg-violet-900/30' },
};

const textStyles: Record<BadgeVariant, { light: string; dark: string }> = {
  default: { light: 'text-slate-700', dark: 'text-slate-200' },
  success: { light: 'text-emerald-700', dark: 'text-emerald-300' },
  warning: { light: 'text-amber-700', dark: 'text-amber-300' },
  error: { light: 'text-red-700', dark: 'text-red-300' },
  info: { light: 'text-blue-700', dark: 'text-blue-300' },
  purple: { light: 'text-violet-700', dark: 'text-violet-300' },
};

export function Badge({ label, variant = 'default', className, ...props }: BadgeProps) {
  const isDark = useResolvedColorScheme() === 'dark';
  const surface = variantStyles[variant];
  const text = textStyles[variant];

  return (
    <View className={cn('self-center rounded-full px-3 py-1', isDark ? surface.dark : surface.light, className)} {...props}>
      <Text variant="caption" className={cn('text-center', isDark ? text.dark : text.light)}>
        {label}
      </Text>
    </View>
  );
}
