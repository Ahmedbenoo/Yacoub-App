import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';
import { getStartTextAlign } from '@/shared/hooks/useLayoutDirection';
import { getTypedFontStyle } from '@/shared/theme/fonts';
import { typography } from '@/shared/theme/tokens';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

type TextVariant = keyof typeof typography;

const BLOCK_VARIANTS = new Set<TextVariant>(['titleLg', 'titleMd', 'titleSm', 'body', 'bodySm']);

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  muted?: boolean;
}

export function Text({
  variant = 'body',
  className,
  muted = false,
  style,
  ...props
}: TextProps) {
  const isRtl = useLocaleStore((s) => s.isRtl);
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const token = typography[variant];
  const mergedClassName = cn(
    muted
      ? isDark
        ? 'text-slate-400'
        : 'text-slate-500'
      : isDark
        ? 'text-slate-50'
        : 'text-slate-900',
    className,
  );
  const isCentered = mergedClassName.includes('text-center');
  const isBlockVariant = BLOCK_VARIANTS.has(variant);

  return (
    <RNText
      className={mergedClassName}
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          writingDirection: isRtl ? 'rtl' : 'ltr',
          alignSelf: isCentered ? 'center' : isBlockVariant ? 'stretch' : undefined,
        },
        style,
        getTypedFontStyle(isRtl, token.fontWeight, mergedClassName),
        { textAlign: getStartTextAlign(isRtl, isCentered) },
      ]}
      {...props}
    />
  );
}
