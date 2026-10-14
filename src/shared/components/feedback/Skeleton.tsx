import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { cn, themeBg } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

export function Skeleton({ width = '100%', height = 16, className, rounded = 'md' }: SkeletonProps) {
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.55, { duration: 700 })),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={cn(
        roundedMap[rounded],
        isDark ? 'bg-slate-700' : 'bg-slate-200',
        className,
      )}
      style={[{ width, height }, animatedStyle]}
    />
  );
}

export function SkeletonCard() {
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <View
      className={cn(
        'gap-3 rounded-2xl border p-4',
        themeBg(isDark, 'border-slate-100 bg-white', 'border-slate-700 bg-slate-800'),
      )}
    >
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={14} width="80%" />
    </View>
  );
}
