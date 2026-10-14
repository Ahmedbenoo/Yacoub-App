import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/shared/components/ui/Text';
import { Icon } from '@/shared/components/ui/Icon';
import { cn } from '@/shared/lib/utils';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { useLocaleStore } from '@/shared/stores';
import { getTypedFontStyle } from '@/shared/theme/fonts';
import { typography } from '@/shared/theme/tokens';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  compact?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  searchable = false,
  compact = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t } = useTranslation('common');
  const isRtl = useLocaleStore((s) => s.isRtl);
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const { forwardIconName, rowStyle, alignInlineStart } = useLayoutDirection();

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!searchable || !normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, searchable]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  return (
    <View className={cn('gap-1.5', compact && 'shrink-0 self-start')} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {label && !compact && (
        <Text variant="label" muted>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        style={rowStyle}
        className={cn(
          'flex-row items-center rounded-xl border',
          compact ? 'gap-1 self-start px-3 py-2' : 'min-h-[48px] gap-2 px-4',
          compact
            ? isDark
              ? 'border-primary-700 bg-primary-900/40'
              : 'border-primary-200 bg-primary-50'
            : isDark
              ? 'border-slate-600 bg-slate-800'
              : 'border-slate-200 bg-white',
          error && 'border-status-error',
        )}
      >
        <Text
          variant={compact ? 'label' : 'body'}
          muted={!selected && !compact}
          numberOfLines={1}
          className={cn(!compact && 'min-w-0 flex-1 shrink', compact && 'text-primary-700 dark:text-primary-300')}
          style={{ alignSelf: 'auto' }}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name={compact ? 'chevronDown' : forwardIconName} size={18} color={compact ? '#0D9488' : '#94A3B8'} />
      </Pressable>

      {error && (
        <Text variant="caption" className="text-status-error">
          {error}
        </Text>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={close}>
          <Pressable
            className={cn(
              'max-h-[70%] rounded-t-3xl px-5 pb-8 pt-4',
              isDark ? 'bg-slate-900' : 'bg-white',
            )}
            onPress={(event) => event.stopPropagation()}
          >
            {label && (
              <Text variant="titleSm" className="mb-4 text-center">
                {label}
              </Text>
            )}

            {searchable && (
              <View className="mb-3">
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('select.searchPlaceholder')}
                  placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  autoFocus
                  textAlign={isRtl ? 'right' : 'left'}
                  className={cn(
                    'min-h-[48px] rounded-xl border px-4',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900',
                  )}
                  style={{
                    fontSize: typography.bodySm.fontSize,
                    lineHeight: typography.bodySm.lineHeight,
                    writingDirection: isRtl ? 'rtl' : 'ltr',
                    includeFontPadding: false,
                    paddingVertical: 12,
                    ...getTypedFontStyle(isRtl, '400'),
                  }}
                />
              </View>
            )}

            <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
              {filteredOptions.length === 0 ? (
                <Text variant="bodySm" muted className="px-4 py-6 text-center">
                  {t('select.empty')}
                </Text>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelect(option.value)}
                      className={cn(
                        'rounded-xl px-4 py-3',
                        isSelected && (isDark ? 'bg-primary-900/40' : 'bg-primary-50'),
                      )}
                    >
                      <Text
                        variant="body"
                        style={alignInlineStart}
                        className={cn(isSelected && 'text-primary-700 dark:text-primary-300')}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
