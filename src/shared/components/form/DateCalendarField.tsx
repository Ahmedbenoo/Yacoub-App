import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';

const ARABIC_WEEKDAYS_FROM_SUNDAY = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDayKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthCells(year: number, month: number, weekStartsOn: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface DateCalendarFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DateCalendarField({ label, value, onChange, error }: DateCalendarFieldProps) {
  const isDark = useResolvedColorScheme() === 'dark';
  const locale = useLocaleStore((s) => s.locale);
  const { isRtl, rowStyle, backIconName, forwardIconName } = useLayoutDirection();
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value ? parseDayKey(value) : today));
  const weekStartsOn = isRtl ? 6 : 0;
  const minMonth = startOfMonth(today);
  const maxMonth = addMonths(minMonth, 6);
  const canGoPrev = visibleMonth.getTime() > minMonth.getTime();
  const canGoNext = visibleMonth.getTime() < maxMonth.getTime();
  const cells = monthCells(visibleMonth.getFullYear(), visibleMonth.getMonth(), weekStartsOn);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const dayIndex = (weekStartsOn + index) % 7;
    if (String(locale).startsWith('ar')) return ARABIC_WEEKDAYS_FROM_SUNDAY[dayIndex];
    const sunday = new Date(2024, 0, 7);
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + dayIndex);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day);
  });
  const selectedLabel = value
    ? new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDayKey(value))
    : '';

  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      {selectedLabel ? <Text variant="bodySm">{selectedLabel}</Text> : null}
      <View
        className={cn(
          'rounded-2xl border p-3',
          error ? 'border-status-error' : themeBg(isDark, 'border-slate-200 bg-white', 'border-slate-700 bg-slate-800'),
        )}
      >
        <View className="mb-3 items-center justify-between" style={rowStyle}>
          <Pressable
            accessibilityRole="button"
            disabled={!canGoPrev}
            onPress={() => canGoPrev && setVisibleMonth((month) => addMonths(month, -1))}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <Icon name={backIconName} size={18} color={canGoPrev ? '#0F172A' : '#CBD5E1'} />
          </Pressable>
          <Text variant="titleSm">
            {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth)}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canGoNext}
            onPress={() => canGoNext && setVisibleMonth((month) => addMonths(month, 1))}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <Icon name={forwardIconName} size={18} color={canGoNext ? '#0F172A' : '#CBD5E1'} />
          </Pressable>
        </View>
        <View className="mb-1" style={rowStyle}>
          {weekdayLabels.map((dayLabel, index) => (
            <View key={`${dayLabel}-${index}`} className="flex-1 items-center">
              <Text variant="caption" muted className="text-center">
                {dayLabel}
              </Text>
            </View>
          ))}
        </View>
        <View className="gap-1">
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={rowStyle}>
              {week.map((cell, cellIndex) => {
                if (!cell) return <View key={`empty-${weekIndex}-${cellIndex}`} className="flex-1" />;
                const key = dayKey(cell);
                const selected = key === value;
                const isToday = key === dayKey(today);
                const disabled = cell < today;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={() => onChange(key)}
                    className="flex-1 items-center py-1"
                  >
                    <View
                      className={cn(
                        'h-10 w-10 items-center justify-center rounded-full',
                        selected && 'bg-primary-600',
                        !selected && isToday && 'border border-primary-600',
                      )}
                    >
                      <Text
                        variant="label"
                        className={cn(selected && 'text-white', disabled && !selected && 'text-slate-300')}
                      >
                        {cell.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      {error ? (
        <Text variant="caption" className="text-status-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
