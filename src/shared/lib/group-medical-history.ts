import { formatDisplayDate } from '@/shared/lib/datetime';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

function dayKey(value: Date): string {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function groupMedicalHistory(
  entries: MedicalHistoryEntry[],
  locale: string,
  labels: { today: string; yesterday: string },
): { key: string; label: string; entries: MedicalHistoryEntry[] }[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(yesterday);
  const groups = new Map<string, MedicalHistoryEntry[]>();

  for (const entry of entries) {
    const key = dayKey(new Date(entry.date));
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  return [...groups.entries()].map(([key, items]) => ({
    key,
    label:
      key === todayKey
        ? labels.today
        : key === yesterdayKey
          ? labels.yesterday
          : formatDisplayDate(items[0].date, locale),
    entries: items,
  }));
}
