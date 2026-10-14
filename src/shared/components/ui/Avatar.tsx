import { Image, View, type ImageSourcePropType } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: AvatarSize;
  imageUrl?: string;
  source?: ImageSourcePropType;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: 'caption' | 'label' | 'titleSm' | 'titleMd' }> = {
  sm: { container: 'h-9 w-9', text: 'caption' },
  md: { container: 'h-11 w-11', text: 'label' },
  lg: { container: 'h-14 w-14', text: 'titleSm' },
  xl: { container: 'h-20 w-20', text: 'titleMd' },
};

export function Avatar({ firstName, lastName, size = 'md', imageUrl, source, className }: AvatarProps) {
  const styles = sizeStyles[size];
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const isDark = useResolvedColorScheme() === 'dark';
  const imageSource = imageUrl ? { uri: imageUrl } : source;

  if (imageSource) {
    return (
      <View
        className={cn(
          'overflow-hidden rounded-full',
          themeBg(isDark, 'bg-slate-200', 'bg-slate-700'),
          styles.container,
          className,
        )}
      >
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          accessibilityLabel={`${firstName} ${lastName}`}
        />
      </View>
    );
  }

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full',
        themeBg(isDark, 'bg-primary-100', 'bg-primary-900/40'),
        styles.container,
        className,
      )}
    >
      <Text variant={styles.text} className={cn('text-center', isDark ? 'text-primary-300' : 'text-primary-700')}>
        {initials}
      </Text>
    </View>
  );
}
