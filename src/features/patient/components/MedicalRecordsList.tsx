import { useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MedicalRecordImageModal } from '@/features/patient/components/MedicalRecordImageModal';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { groupMedicalHistory } from '@/shared/lib/group-medical-history';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { getPatientRecordHref, getPatientVisitHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

interface MedicalRecordsListProps {
  entries: MedicalHistoryEntry[];
}

const typeColors: Record<MedicalHistoryEntry['type'], string> = {
  visit: 'text-primary-600',
  prescription: 'text-cyan-600',
  lab: 'text-orange-600',
  radiology: 'text-violet-600',
};

export function MedicalRecordsList({ entries }: MedicalRecordsListProps) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const [preview, setPreview] = useState<MedicalHistoryEntry | null>(null);

  const groups = useMemo(
    () =>
      groupMedicalHistory(entries, locale, {
        today: t('records.groups.today'),
        yesterday: t('records.groups.yesterday'),
      }),
    [entries, locale, t],
  );

  if (entries.length === 0) {
    return (
      <Text variant="bodySm" muted>
        {t('records.empty.description')}
      </Text>
    );
  }

  return (
    <View className="gap-5">
      {groups.map((group) => (
        <View key={group.key} className="gap-2">
          <Text variant="caption" muted className="px-1">
            {group.label}
          </Text>
          {group.entries.map((entry) => {
            const href = entry.imageUrl ? null : getPatientRecordHref(entry);
            const body = (
              <View className="flex-row items-start gap-3">
                {entry.imageUrl ? (
                  <Image
                    source={{ uri: entry.imageUrl }}
                    className="h-14 w-14 rounded-xl bg-slate-100"
                    resizeMode="cover"
                  />
                ) : null}
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text variant="label" className={typeColors[entry.type]}>
                      {t(`history.types.${entry.type}`)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text variant="caption" muted>
                        {formatDisplayDate(entry.date, locale)}
                      </Text>
                      {href || entry.imageUrl ? (
                        <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={16} color="#94A3B8" />
                      ) : null}
                    </View>
                  </View>
                  {entry.source === 'patient' ? (
                    <Text variant="caption" className="text-primary-600">
                      {t('records.uploadedByYou')}
                    </Text>
                  ) : null}
                  <Text variant="titleSm">{entry.title}</Text>
                  {entry.source === 'patient' && entry.description ? (
                    <Text variant="bodySm" muted>
                      {t('records.linkedTo', { doctor: entry.description })}
                    </Text>
                  ) : entry.description ? (
                    <Text variant="bodySm" muted>
                      {entry.description}
                    </Text>
                  ) : null}
                  {entry.doctorReply ? (
                    <Text variant="caption" className="text-primary-700 dark:text-primary-300">
                      {t('records.doctorReply')}: {entry.doctorReply}
                    </Text>
                  ) : null}
                </View>
              </View>
            );

            if (entry.imageUrl) {
              return (
                <Card key={entry.id} className="p-0">
                  <HrefPressable className="p-4 active:opacity-80" onPress={() => setPreview(entry)}>
                    {body}
                  </HrefPressable>
                </Card>
              );
            }

            if (!href) {
              return (
                <Card key={entry.id} className="p-4">
                  {body}
                </Card>
              );
            }

            return (
              <Card key={entry.id} className="p-0">
                <HrefPressable href={href} className="p-4 active:opacity-80">
                  {body}
                </HrefPressable>
              </Card>
            );
          })}
        </View>
      ))}
      <MedicalRecordImageModal
        entry={preview}
        onClose={() => setPreview(null)}
        visitHref={preview?.visitId ? getPatientVisitHref(preview.visitId) : null}
      />
    </View>
  );
}
