import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLocaleStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';

const HOURS_12 = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

function parseTime(value: string): { hour12: number; minute: number; pm: boolean } {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const hour24 = Number.isFinite(rawHour) ? rawHour : 9;
  const minute = Number.isFinite(rawMinute) ? Math.min(59, Math.max(0, rawMinute)) : 0;
  const snapped = MINUTES.reduce((best, item) => (Math.abs(item - minute) < Math.abs(best - minute) ? item : best), 0);
  const pm = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute: snapped, pm };
}

function toValue(hour12: number, minute: number, pm: boolean): string {
  let hour24 = hour12 % 12;
  if (pm) hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatClock(value: string, arabic: boolean): string {
  const { hour12, minute, pm } = parseTime(value);
  const suffix = arabic ? (pm ? 'م' : 'ص') : pm ? 'PM' : 'AM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function WheelColumn({
  items,
  selected,
  onSelect,
  isDark,
}: {
  items: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  isDark: boolean;
}) {
  return (
    <ScrollView className="max-h-56 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'stretch' }}>
      {items.map((item) => {
        const active = item.value === selected;
        return (
          <Pressable
            key={item.value}
            onPress={() => onSelect(item.value)}
            className={cn(
              'mx-1 items-center justify-center rounded-2xl py-2.5',
              active && (isDark ? 'bg-primary-900/50' : 'bg-[#F0FDFA]'),
            )}
          >
            <Text
              variant="titleSm"
              className={cn('w-full text-center', active && 'text-[#0F766E] dark:text-primary-300')}
              muted={!active}
              style={{ textAlign: 'center', alignSelf: 'stretch' }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function TimePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation('common');
  const locale = useLocaleStore((state) => state.locale);
  const arabic = locale === 'ar';
  const isDark = useResolvedColorScheme() === 'dark';
  const [open, setOpen] = useState(false);
  const parsed = parseTime(value);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [pm, setPm] = useState(parsed.pm);

  useEffect(() => {
    if (!open) return;
    const next = parseTime(value);
    setHour12(next.hour12);
    setMinute(next.minute);
    setPm(next.pm);
  }, [open, value]);

  const confirm = () => {
    onChange(toValue(hour12, minute, pm));
    setOpen(false);
  };

  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="label" muted>
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'h-[52px] flex-row items-center justify-between rounded-2xl border px-4',
          isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white',
        )}
      >
        <Text
          variant="titleSm"
          style={{
            alignSelf: 'center',
            lineHeight: 22,
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
        >
          {formatClock(value, arabic)}
        </Text>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-[#F0FDFA] dark:bg-primary-900/40">
          <Icon name="clock" size={16} color="#0F766E" />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/45" onPress={() => setOpen(false)}>
          <Pressable
            className={cn('rounded-t-[28px] px-5 pt-4', isDark ? 'bg-slate-900' : 'bg-white')}
            onPress={(event) => event.stopPropagation()}
          >
            <SafeAreaView edges={['bottom']}>
              <View className="mb-4 items-center">
                <View className="mb-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                {label ? (
                  <Text variant="titleSm" className="text-center">
                    {label}
                  </Text>
                ) : null}
                <Text variant="titleMd" className="mt-1 text-[#0F766E]">
                  {formatClock(toValue(hour12, minute, pm), arabic)}
                </Text>
              </View>

              <View className="mb-2 flex-row gap-2">
                <Text variant="caption" muted className="flex-1 text-center">
                  {t('hour')}
                </Text>
                <Text variant="caption" muted className="flex-1 text-center">
                  {t('minute')}
                </Text>
                <Text variant="caption" muted className="flex-1 text-center">
                  {arabic ? 'ص / م' : 'AM / PM'}
                </Text>
              </View>

              <View className="mb-5 h-56 flex-row gap-2">
                <WheelColumn
                  isDark={isDark}
                  selected={String(hour12)}
                  onSelect={(next) => setHour12(Number(next))}
                  items={HOURS_12.map((hour) => ({ value: String(hour), label: String(hour) }))}
                />
                <WheelColumn
                  isDark={isDark}
                  selected={String(minute)}
                  onSelect={(next) => setMinute(Number(next))}
                  items={MINUTES.map((item) => ({
                    value: String(item),
                    label: String(item).padStart(2, '0'),
                  }))}
                />
                <WheelColumn
                  isDark={isDark}
                  selected={pm ? 'pm' : 'am'}
                  onSelect={(next) => setPm(next === 'pm')}
                  items={[
                    { value: 'am', label: arabic ? 'ص' : 'AM' },
                    { value: 'pm', label: arabic ? 'م' : 'PM' },
                  ]}
                />
              </View>

              <Button title={t('done')} onPress={confirm} fullWidth />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
