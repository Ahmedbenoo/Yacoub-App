import { Pressable } from 'react-native';

import { Row } from '@/shared/components/layout/Row';
import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Row className={cn('gap-2 rounded-2xl p-1', themeBg(isDark, 'bg-slate-100', 'bg-slate-800'), className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              'flex-1 items-center justify-center rounded-xl py-2.5',
              isActive
                ? themeBg(isDark, 'bg-white shadow-sm', 'bg-slate-700')
                : 'bg-transparent',
            )}
          >
            <Text
              variant="label"
              numberOfLines={2}
              className={cn(
                'px-1 text-center',
                isActive ? (isDark ? 'text-primary-300' : 'text-primary-700') : undefined,
              )}
              muted={!isActive}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </Row>
  );
}
