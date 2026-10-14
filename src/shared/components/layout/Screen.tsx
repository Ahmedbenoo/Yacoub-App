import { Platform, ScrollView, View, type ViewProps } from 'react-native';

import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { cn } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Screen({
  scroll = false,
  padded = true,
  className,
  children,
  ...props
}: ScreenProps) {
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const { direction } = useLayoutDirection();
  const webDirectionStyle = Platform.OS === 'web' ? { direction } : undefined;

  const content = (
    <View
      className={cn(
        'flex-1',
        isDark ? 'bg-slate-900' : 'bg-slate-50',
        padded && 'px-5',
        className,
      )}
      style={[{ flex: 1 }, webDirectionStyle]}
      {...props}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        className={cn('flex-1', isDark ? 'bg-slate-900' : 'bg-slate-50')}
        style={{ flex: 1 }}
        contentContainerStyle={[{ flexGrow: 1 }, webDirectionStyle]}
        contentContainerClassName={cn(padded && 'px-5 pb-8', className)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return content;
}
