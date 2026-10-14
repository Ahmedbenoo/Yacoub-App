import { StyleSheet, View } from 'react-native';

import { LogoLoading } from '@/shared/components/brand/LogoLoading';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';

interface SpinnerProps {
  message?: string;
  fullScreen?: boolean;
  showLogo?: boolean;
}

export function Spinner({ message, fullScreen = false, showLogo = false }: SpinnerProps) {
  const isDark = useResolvedColorScheme() === 'dark';
  const content = (
    <View className="items-center justify-center gap-4" style={styles.content}>
      <LogoLoading size={showLogo || fullScreen ? 'lg' : 'sm'} />
      {message ? (
        <Text variant="bodySm" muted>
          {message}
        </Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        className={`flex-1 items-center justify-center ${themeBg(isDark, 'bg-slate-50', 'bg-slate-900')}`}
        style={[styles.fullScreen, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
      >
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
