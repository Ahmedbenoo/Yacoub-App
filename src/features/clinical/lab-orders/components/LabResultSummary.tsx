import { View } from 'react-native';

import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { Text } from '@/shared/components/ui/Text';
import { Locale } from '@/shared/types/enums';
import { useLocaleStore } from '@/shared/stores';

const LABEL_AR: Record<string, string> = {
  Hemoglobin: 'الهيموجلوبين',
  WBC: 'كرات الدم البيضاء',
  Platelets: 'الصفائح الدمويه',
  'Total cholesterol': 'الكوليسترول الكلى',
  LDL: 'الكوليسترول الضار',
  HDL: 'الكوليسترول النافع',
};

const NOTE_AR: Record<string, string> = {
  'all values within normal range': 'كل القيم فى المعدل الطبيعى.',
  'borderline ldl, lifestyle advice given': 'الكوليسترول الضار على الحد، مع نصيحه بتعديل الاسلوب.',
};

function splitResultSummary(summary: string) {
  const [measurements, ...noteParts] = summary.split(/\s+[—–-]\s+/);
  const note = noteParts.join(' — ').replace(/\.\s*$/, '').trim();
  const rows = measurements
    .split(',')
    .map((part) => part.trim().replace(/\.\s*$/, ''))
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^([A-Za-z][A-Za-z0-9 /+-]*?)\s+(\d.*)$/);
      if (!match?.[1] || !match[2]) return null;
      return { label: match[1].trim(), value: match[2].trim() };
    });

  if (rows.length === 0 || rows.some((row) => row === null)) {
    return { rows: [] as { label: string; value: string }[], note: '' };
  }

  return { rows: rows as { label: string; value: string }[], note };
}

export function LabResultSummary({ summary }: { summary: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const arabic = locale === Locale.AR;
  const { rowStyle } = useLayoutDirection();
  const parsed = splitResultSummary(summary);

  if (parsed.rows.length === 0) {
    return (
      <Text variant="body" style={{ writingDirection: 'ltr' }}>
        {summary}
      </Text>
    );
  }

  const note = arabic ? (NOTE_AR[parsed.note.toLowerCase()] ?? parsed.note) : parsed.note;

  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700">
        {parsed.rows.map((row, index) => (
          <View
            key={row.label}
            className={index > 0 ? 'border-t border-slate-100 px-3 py-3 dark:border-slate-700' : 'px-3 py-3'}
            style={[rowStyle, { alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}
          >
            <Text variant="bodySm" muted style={{ flex: 1 }}>
              {arabic ? (LABEL_AR[row.label] ?? row.label) : row.label}
            </Text>
            <Text variant="body" style={{ writingDirection: 'ltr', alignSelf: 'auto' }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
      {note ? (
        <Text variant="bodySm" muted style={arabic && NOTE_AR[parsed.note.toLowerCase()] ? undefined : { writingDirection: 'ltr' }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
