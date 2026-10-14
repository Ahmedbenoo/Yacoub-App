import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatSlotTime,
  getDateDayKey,
  getSlotDayKey,
  groupBookingSlotsByDay,
} from '@/features/patient/lib/formatters';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';
import type { BookingSlot } from '@/shared/types/models/doctor';

interface BookingSlotPickerProps {
  slots: BookingSlot[];
  selectedSlot: string | null;
  onSelect: (scheduledAt: string) => void;
}

function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

const ARABIC_WEEKDAYS_FROM_SUNDAY = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function weekdayLabels(locale: string, weekStartsOn: number): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const dayIndex = (weekStartsOn + index) % 7;
    if (locale.startsWith('ar')) {
      return ARABIC_WEEKDAYS_FROM_SUNDAY[dayIndex];
    }

    const sunday = new Date(2024, 0, 7);
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + dayIndex);
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
  });
}

function monthCells(year: number, month: number, weekStartsOn: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatSelectedDay(date: Date, locale: string, todayLabel: string, tomorrowLabel: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (offset === 0) return todayLabel;
  if (offset === 1) return tomorrowLabel;

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function BookingSlotPicker({ slots, selectedSlot, onSelect }: BookingSlotPickerProps) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const { isRtl, backIconName, forwardIconName, rowStyle } = useLayoutDirection();
  const days = useMemo(() => groupBookingSlotsByDay(slots), [slots]);
  const availableKeys = useMemo(() => new Set(days.map((day) => day.key)), [days]);
  const [activeDay, setActiveDay] = useState(days[0]?.key ?? '');
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(days[0] ? parseDayKey(days[0].key) : new Date()),
  );

  useEffect(() => {
    if (!days.length) {
      setActiveDay('');
      return;
    }

    const firstKey = days[0].key;
    const lastKey = days[days.length - 1].key;
    if (!activeDay || activeDay < firstKey || activeDay > lastKey) {
      setActiveDay(firstKey);
    }
  }, [activeDay, days]);

  useEffect(() => {
    if (!selectedSlot) return;
    const key = getSlotDayKey(selectedSlot);
    setActiveDay(key);
    setVisibleMonth(startOfMonth(parseDayKey(key)));
  }, [selectedSlot]);

  if (slots.length === 0) {
    return (
      <Text variant="bodySm" muted>
        {t('booking.noSlots')}
      </Text>
    );
  }

  const currentDay = days.find((day) => day.key === activeDay);
  const selectedDate = activeDay ? parseDayKey(activeDay) : parseDayKey(days[0].key);
  const weekStartsOn = isRtl ? 6 : 0;
  const minMonth = startOfMonth(parseDayKey(days[0].key));
  const maxMonth = startOfMonth(parseDayKey(days[days.length - 1].key));
  const canGoPrev = visibleMonth.getTime() > minMonth.getTime();
  const canGoNext = visibleMonth.getTime() < maxMonth.getTime();
  const todayKey = getDateDayKey(new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const cells = monthCells(visibleMonth.getFullYear(), visibleMonth.getMonth(), weekStartsOn);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));

  const handleToggleCalendar = () => {
    setCalendarOpen((open) => {
      if (!open && activeDay) {
        setVisibleMonth(startOfMonth(parseDayKey(activeDay)));
      }
      return !open;
    });
  };

  const handleSelectDay = (key: string, hasSlots: boolean) => {
    setActiveDay(key);
    if (hasSlots) {
      setCalendarOpen(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text variant="label" muted>
          {t('booking.pickDay')}
        </Text>
        <Pressable
          testID="booking-calendar-toggle"
          onPress={handleToggleCalendar}
          className={cn(
            'flex-row items-center justify-between rounded-2xl border px-4 py-3',
            themeBg(isDark, 'border-slate-200 bg-slate-50', 'border-slate-700 bg-slate-800'),
          )}
        >
          <View className="flex-row items-center gap-3">
            <Icon name="calendar" size={20} color="#0D9488" />
            <View>
              <Text variant="caption" muted>
                {calendarOpen ? t('booking.openCalendar') : t('booking.changeDate')}
              </Text>
              <Text variant="titleSm">
                {formatSelectedDay(selectedDate, locale, t('booking.today'), t('booking.tomorrow'))}
              </Text>
            </View>
          </View>
          <Icon name={calendarOpen ? backIconName : forwardIconName} size={18} color="#0D9488" />
        </Pressable>

        {calendarOpen ? (
          <View
            className={cn(
              'rounded-2xl border p-3',
              themeBg(isDark, 'border-slate-200 bg-white', 'border-slate-700 bg-slate-800'),
            )}
          >
            <View className="mb-3 items-center justify-between" style={rowStyle}>
              <Pressable
                testID="booking-calendar-prev"
                accessibilityRole="button"
                accessibilityLabel={t('booking.prevMonth')}
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
                testID="booking-calendar-next"
                accessibilityRole="button"
                accessibilityLabel={t('booking.nextMonth')}
                disabled={!canGoNext}
                onPress={() => canGoNext && setVisibleMonth((month) => addMonths(month, 1))}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Icon name={forwardIconName} size={18} color={canGoNext ? '#0F172A' : '#CBD5E1'} />
              </Pressable>
            </View>

            <View className="mb-1" style={rowStyle}>
              {weekdayLabels(locale, weekStartsOn).map((label, index) => (
                <View key={`${label}-${index}`} className="flex-1 items-center">
                  <Text variant="caption" muted className="text-center">
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            <View className="gap-1">
              {weeks.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={rowStyle}>
                  {week.map((cell, cellIndex) => {
                    if (!cell) {
                      return <View key={`empty-${weekIndex}-${cellIndex}`} className="flex-1" />;
                    }

                    const key = getDateDayKey(cell);
                    const hasSlots = availableKeys.has(key);
                    const isPast = cell < todayStart;
                    const selected = key === activeDay;
                    const isToday = key === todayKey;
                    const disabled = isPast;

                    return (
                      <Pressable
                        key={key}
                        testID={`booking-day-${key}`}
                        accessibilityRole="button"
                        accessibilityLabel={key}
                        disabled={disabled}
                        onPress={() => handleSelectDay(key, hasSlots)}
                        className="flex-1 items-center py-1"
                      >
                        <View
                          className={cn(
                            'h-10 w-10 items-center justify-center rounded-full',
                            selected && 'bg-primary-600',
                            !selected && isToday && 'border border-primary-600',
                            !selected && hasSlots && themeBg(isDark, 'bg-primary-50', 'bg-slate-700'),
                          )}
                        >
                          <Text
                            variant="label"
                            className={cn(
                              selected && 'text-white',
                              disabled && !selected && themeBg(isDark, 'text-slate-300', 'text-slate-500'),
                            )}
                            muted={!selected && (disabled || !hasSlots)}
                          >
                            {cell.getDate()}
                          </Text>
                        </View>
                        {hasSlots && !selected ? (
                          <View className="mt-1 h-1 w-1 rounded-full bg-primary-600" />
                        ) : (
                          <View className="mt-1 h-1 w-1" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        <Text variant="label" muted>
          {t('booking.pickTime')}
        </Text>
        {currentDay ? (
          <View className="flex-row flex-wrap gap-2">
            {currentDay.slots.map((slot) => {
              const selected = selectedSlot === slot.scheduledAt;
              const globalIndex = slots.findIndex((item) => item.scheduledAt === slot.scheduledAt);

              return (
                <Pressable
                  key={slot.scheduledAt}
                  testID={`booking-slot-${globalIndex}`}
                  onPress={() => onSelect(slot.scheduledAt)}
                  style={{ flexGrow: 1, flexBasis: '30%', maxWidth: '32%' }}
                  className={cn(
                    'items-center rounded-2xl border py-3',
                    selected
                      ? 'border-primary-600 bg-primary-600'
                      : themeBg(isDark, 'border-slate-200 bg-white', 'border-slate-700 bg-slate-800'),
                  )}
                >
                  <Text variant="label" className={selected ? 'text-white' : undefined}>
                    {formatSlotTime(slot.scheduledAt, locale)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text variant="bodySm" muted>
            {t('booking.noSlotsOnDay')}
          </Text>
        )}
      </View>
    </View>
  );
}
