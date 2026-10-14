import { View } from 'react-native';

import { Select } from '@/shared/components/form/Select';
import { Text } from '@/shared/components/ui/Text';

const WEEK_FROM_SATURDAY = [6, 0, 1, 2, 3, 4, 5] as const;
const DAY_NAME: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};
const TIME_VALUES = Array.from({ length: 15 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);

function formatArabicTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'م' : 'ص';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function parseArabicTime(text: string) {
  const match = text.trim().match(/(\d{1,2}):(\d{2})\s*(ص|م|AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = match[3];
  const isPm = suffix === 'م' || suffix.toUpperCase() === 'PM';
  const isAm = suffix === 'ص' || suffix.toUpperCase() === 'AM';
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function dayFromName(name: string) {
  const compact = name.replace(/\s/g, '');
  const found = Object.entries(DAY_NAME).find(([, label]) => label.replace(/\s/g, '') === compact);
  return found ? Number(found[0]) : null;
}

function daysInRange(start: number, end: number) {
  const from = WEEK_FROM_SATURDAY.indexOf(start as (typeof WEEK_FROM_SATURDAY)[number]);
  const to = WEEK_FROM_SATURDAY.indexOf(end as (typeof WEEK_FROM_SATURDAY)[number]);
  if (from < 0 || to < 0 || to < from) return [start];
  return WEEK_FROM_SATURDAY.slice(from, to + 1);
}

export function parseOpeningHours(value: string) {
  const fallback = { days: [6, 0, 1, 2, 3, 4], start: '10:00', end: '22:00' };
  if (!value.trim()) return { days: [], start: '10:00', end: '22:00' };
  const match = value
    .trim()
    .match(/^(.+)،\s*(\d{1,2}:\d{2}\s*(?:ص|م|AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:ص|م|AM|PM))$/i);
  if (!match) return fallback;
  const start = parseArabicTime(match[2]);
  const end = parseArabicTime(match[3]);
  if (!start || !end) return fallback;
  const dayPart = match[1].trim();
  if (dayPart === 'كل يوم') return { days: [...WEEK_FROM_SATURDAY], start, end };
  if (dayPart.includes('–') || dayPart.includes('-')) {
    const [fromName, toName] = dayPart.split(/[–-]/).map((part) => part.trim());
    const from = dayFromName(fromName);
    const to = dayFromName(toName);
    if (from == null || to == null) return { ...fallback, start, end };
    return { days: [...daysInRange(from, to)], start, end };
  }
  const days = dayPart
    .split(/[،,]/)
    .map((part) => dayFromName(part.trim()))
    .filter((day): day is number => day != null);
  return { days: days.length ? days : fallback.days, start, end };
}

export function formatOpeningHours(days: number[], start: string, end: string) {
  const selected = WEEK_FROM_SATURDAY.filter((day) => days.includes(day));
  const from = formatArabicTime(start);
  const to = formatArabicTime(end);
  if (!selected.length) return '';
  if (selected.length === WEEK_FROM_SATURDAY.length) return `كل يوم، ${from} – ${to}`;
  const indexes = selected.map((day) => WEEK_FROM_SATURDAY.indexOf(day));
  const contiguous = indexes.every((index, position) => position === 0 || index === indexes[position - 1] + 1);
  const dayLabel = contiguous
    ? selected.length === 1
      ? DAY_NAME[selected[0]]
      : `${DAY_NAME[selected[0]]}–${DAY_NAME[selected[selected.length - 1]]}`
    : selected.map((day) => DAY_NAME[day]).join('، ');
  return `${dayLabel}، ${from} – ${to}`;
}

const TIME_OPTIONS = TIME_VALUES.map((value) => ({
  value,
  label: `\u2066${formatArabicTime(value)}\u2069`,
}));

const DAY_OPTIONS = WEEK_FROM_SATURDAY.map((day) => ({
  value: String(day),
  label: DAY_NAME[day],
}));

export function OpeningHoursCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseOpeningHours(value);
  const orderedDays = WEEK_FROM_SATURDAY.filter((day) => parsed.days.includes(day));
  const fromDay = orderedDays[0] ?? 6;
  const toDay = orderedDays[orderedDays.length - 1] ?? 4;

  const update = (days: number[], start: string, end: string) => {
    onChange(formatOpeningHours(days, start, end));
  };

  const updateDays = (from: number, to: number) => {
    const startIndex = WEEK_FROM_SATURDAY.indexOf(from as (typeof WEEK_FROM_SATURDAY)[number]);
    const endIndex = WEEK_FROM_SATURDAY.indexOf(to as (typeof WEEK_FROM_SATURDAY)[number]);
    const nextTo = endIndex < startIndex ? from : to;
    update([...daysInRange(from, nextTo)], parsed.start, parsed.end);
  };

  return (
    <View className="gap-3">
      <Text variant="label">مواعيد العمل</Text>
      <View className="flex-row gap-3">
        <View className="min-w-0 flex-1">
          <Select
            label="من يوم"
            value={String(fromDay)}
            options={DAY_OPTIONS}
            onChange={(day) => updateDays(Number(day), toDay)}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Select
            label="إلى يوم"
            value={String(toDay)}
            options={DAY_OPTIONS}
            onChange={(day) => updateDays(fromDay, Number(day))}
          />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="min-w-0 flex-1">
          <Select
            label="من"
            value={parsed.start}
            options={TIME_OPTIONS}
            onChange={(start) => update(parsed.days, start, parsed.end)}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Select
            label="إلى"
            value={parsed.end}
            options={TIME_OPTIONS}
            onChange={(end) => update(parsed.days, parsed.start, end)}
          />
        </View>
      </View>
    </View>
  );
}
