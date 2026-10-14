import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { cn } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({ title, showBack = false, onBack, rightAction, className }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const { direction, backIconName } = useLayoutDirection();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={{ paddingTop: insets.top + 5 }}>
      <View
        className={cn('flex-row items-center justify-between py-3', className)}
        style={{ direction }}
      >
        <View className="min-w-[44px]">
          {showBack && (
            <Pressable
              onPress={handleBack}
              className={cn(
                'h-11 w-11 items-center justify-center rounded-full',
                isDark ? 'bg-slate-800' : 'bg-slate-100',
              )}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
            >
              <Icon name={backIconName} size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </Pressable>
          )}
        </View>

        {title ? (
          <Text variant="titleSm" className="flex-1 text-center" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View className="flex-1" />
        )}

        <View className="min-w-[44px] items-center justify-center">{rightAction}</View>
      </View>
    </View>
  );
}
