import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';

const logoLight = require('../../../../assets/images/logo-munjiz.png');
const logoOnDark = require('../../../../assets/images/logo-munjiz.png');

/** Source asset is 1024×558. */
const LOGO_ASPECT = 1024 / 558;

type LogoSize = 'sm' | 'nav' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  /** @deprecated Full logo already includes the brand name */
  showName?: boolean;
  className?: string;
  align?: 'start' | 'center';
  /** Stretch logo to the full width of its container (for nav bars). */
  fillWidth?: boolean;
  /** Cap visible height — used by nav bar for consistent sizing across roles. */
  maxVisibleHeight?: number;
  /** Override the logo box width (nav bar). */
  boxWidth?: number;
}

const sizeMap: Record<LogoSize, { height: number }> = {
  sm: { height: 28 },
  nav: { height: 38 },
  md: { height: 48 },
  lg: { height: 64 },
  xl: { height: 80 },
};

export function Logo({
  size = 'md',
  className,
  align = 'center',
  fillWidth = false,
  maxVisibleHeight,
  boxWidth,
}: LogoProps) {
  const { t } = useTranslation('common');
  const isRtl = useLocaleStore((s) => s.isRtl);
  const isDark = useResolvedColorScheme() === 'dark';
  const fallbackHeight = maxVisibleHeight ?? sizeMap[size].height;
  const width = fillWidth ? undefined : boxWidth ?? fallbackHeight * LOGO_ASPECT;
  const height = width ? width / LOGO_ASPECT : fallbackHeight;
  const alignItems =
    align === 'center' ? 'center' : isRtl ? 'flex-end' : 'flex-start';

  return (
    <View
      className={cn('shrink-0 justify-center overflow-hidden', fillWidth && 'flex-1', className)}
      style={
        fillWidth
          ? { height: fallbackHeight, alignItems, direction: 'ltr' }
          : { height, width, alignItems, direction: 'ltr' }
      }
      accessibilityRole="image"
      accessibilityLabel={t('appName')}
    >
      <Image
        source={isDark ? logoOnDark : logoLight}
        style={{
          width: fillWidth ? '100%' : width,
          height: fillWidth ? fallbackHeight : height,
          backgroundColor: 'transparent',
        }}
        resizeMode="contain"
      />
    </View>
  );
}
