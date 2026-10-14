import { View, type ViewProps } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface CardProps extends ViewProps {
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export function Card({ className, elevated = false, interactive = false, children, ...props }: CardProps) {
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={cn(
        'rounded-2xl border p-4',
        isDark ? 'border-slate-700/80 bg-slate-800' : 'border-slate-100 bg-white',
        elevated && (isDark ? 'shadow-lg shadow-black/30' : 'shadow-md shadow-slate-200/80'),
        interactive && 'active:scale-[0.99] active:opacity-95',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}
