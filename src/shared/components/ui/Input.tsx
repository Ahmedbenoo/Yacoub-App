import type { ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';
import { getTypedFontStyle } from '@/shared/theme/fonts';
import { typography } from '@/shared/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
  leadingIcon?: ReactNode;
}

export function Input({
  label,
  error,
  helper,
  containerClassName,
  className,
  editable = true,
  style,
  leadingIcon,
  ...props
}: InputProps) {
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const isRtl = useLocaleStore((s) => s.isRtl);

  return (
    <View className={cn('gap-1.5', containerClassName)} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {label && (
        <Text variant="label" muted>
          {label}
        </Text>
      )}
      <View>
        {leadingIcon ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              [isRtl ? 'right' : 'left']: 14,
              zIndex: 1,
              justifyContent: 'center',
            }}
          >
            {leadingIcon}
          </View>
        ) : null}
        <TextInput
          className={cn(
            'min-h-[48px] rounded-xl border px-4',
            isDark
              ? 'border-slate-600 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-900',
            error && 'border-status-error',
            !editable && 'opacity-60',
            className,
          )}
          placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
          editable={editable}
          textAlign={isRtl ? 'right' : 'left'}
          style={[
            {
              fontSize: typography.bodySm.fontSize,
              lineHeight: typography.bodySm.lineHeight,
              writingDirection: isRtl ? 'rtl' : 'ltr',
              includeFontPadding: false,
              paddingVertical: 12,
              ...(leadingIcon
                ? isRtl
                  ? { paddingRight: 42, paddingLeft: 16 }
                  : { paddingLeft: 42, paddingRight: 16 }
                : null),
            },
            style,
            getTypedFontStyle(isRtl, '400'),
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text variant="caption" className="text-status-error">
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text variant="caption" muted>
          {helper}
        </Text>
      )}
    </View>
  );
}
