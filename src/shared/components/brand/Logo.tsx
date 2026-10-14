import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/utils';

const logoSource = require('../../../../assets/images/logo-yacoub.png');

/** Source asset is 601×221. */
const LOGO_ASPECT = 601 / 221;

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
}

const sizeMap: Record<LogoSize, { height: number }> = {
  sm: { height: 28 },
  nav: { height: 34 },
  md: { height: 40 },
  lg: { height: 56 },
  xl: { height: 72 },
};

export function Logo({
  size = 'md',
  className,
  align = 'center',
  fillWidth = false,
  maxVisibleHeight,
}: LogoProps) {
  const { t } = useTranslation('common');
  const height = maxVisibleHeight ?? sizeMap[size].height;
  const width = fillWidth ? undefined : height * LOGO_ASPECT;

  return (
    <View
      className={cn(
        'shrink-0 justify-center overflow-hidden',
        align === 'start' ? 'items-start' : 'items-center',
        fillWidth && 'flex-1',
        className,
      )}
      style={fillWidth ? { height } : { height, width }}
      accessibilityRole="image"
      accessibilityLabel={t('appName')}
    >
      <Image
        source={logoSource}
        style={
          fillWidth
            ? { width: '100%', height, maxHeight: '100%' }
            : { height, width }
        }
        resizeMode="contain"
      />
    </View>
  );
}
