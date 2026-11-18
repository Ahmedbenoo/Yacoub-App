import { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useReplyPatientDocumentMutation } from '@/features/patients/hooks/usePatientQueries';
import { MedicalRecordImageModal } from '@/features/patient/components/MedicalRecordImageModal';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { groupMedicalHistory } from '@/shared/lib/group-medical-history';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { getClinicalRecordHref, getVisitHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

interface MedicalHistoryListProps {
  entries: MedicalHistoryEntry[];
  viewerRole?: UserRole.DOCTOR | UserRole.ADMIN | UserRole.SECRETARY;
}

const typeColors: Record<MedicalHistoryEntry['type'], string> = {
  visit: 'text-primary-600',
  prescription: 'text-cyan-600',
  lab: 'text-orange-600',
  radiology: 'text-violet-600',
};

export function MedicalHistoryList({ entries, viewerRole }: MedicalHistoryListProps) {
  const { t } = useTranslation(['doctor', 'patient']);
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const [preview, setPreview] = useState<MedicalHistoryEntry | null>(null);
  const patientId = preview?.patientId ?? entries[0]?.patientId ?? '';
  const reply = useReplyPatientDocumentMutation(patientId);

  const groups = useMemo(
    () =>
      groupMedicalHistory(entries, locale, {
        today: t('history.today'),
        yesterday: t('history.yesterday'),
      }),
    [entries, locale, t],
  );

  if (entries.length === 0) {
    return (
      <Text variant="bodySm" muted>
        {t('patients.historyEmpty')}
      </Text>
    );
  }

  return (
    <View className="gap-5">
      {groups.map((group) => (
        <View key={group.key} className="gap-2">
          <Text variant="caption" muted>
            {group.label}
          </Text>
          {group.entries.map((entry) => {
            const href = entry.imageUrl || !viewerRole ? null : getClinicalRecordHref(viewerRole, entry);
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
                  <Row className="items-center justify-between gap-3">
                    <Text variant="label" className={typeColors[entry.type]}>
                      {t(`history.types.${entry.type}`)}
                    </Text>
                    <Row className="items-center gap-2">
                      <Text variant="caption" muted>
                        {formatDisplayDate(entry.date, locale)}
                      </Text>
                      {href || entry.imageUrl ? (
                        <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={16} color="#94A3B8" />
                      ) : null}
                    </Row>
                  </Row>
                  {entry.source === 'patient' ? (
                    <Text variant="caption" className="text-primary-600">
                      {t('history.uploadedByPatient')}
                    </Text>
                  ) : null}
                  <Text variant="titleSm">{entry.title}</Text>
                  {entry.source === 'patient' && entry.description ? (
                    <Text variant="bodySm" muted>
                      {t('history.linkedTo', { doctor: entry.description })}
                    </Text>
                  ) : entry.description ? (
                    <Text variant="bodySm" muted>
                      {entry.description}
                    </Text>
                  ) : null}
                  {entry.doctorReply ? (
                    <Text variant="caption" className="text-primary-700 dark:text-primary-300">
                      {t('patient:records.doctorReply')}: {entry.doctorReply}
                    </Text>
                  ) : null}
                </View>
              </View>
            );

            if (entry.imageUrl) {
              return (
                <Card key={entry.id} className="p-0">
                  <Pressable className="p-4 active:opacity-80" onPress={() => setPreview(entry)}>
                    {body}
                  </Pressable>
                </Card>
              );
            }

            if (href) {
              return (
                <Card key={entry.id} className="p-0">
                  <HrefPressable href={href} className="p-4 active:opacity-80">
                    {body}
                  </HrefPressable>
                </Card>
              );
            }

            return (
              <Card key={entry.id} className="p-4">
                {body}
              </Card>
            );
          })}
        </View>
      ))}
      <MedicalRecordImageModal
        entry={preview}
        onClose={() => setPreview(null)}
        visitHref={
          preview?.visitId && viewerRole && viewerRole !== UserRole.SECRETARY
            ? getVisitHref(viewerRole, preview.visitId)
            : null
        }
        canReply={viewerRole === UserRole.DOCTOR && preview?.source === 'patient' && Boolean(preview.resourceId)}
        replyLoading={reply.isPending}
        onReply={(message) => {
          if (!preview?.resourceId) return;
          reply.mutate(
            { documentId: preview.resourceId, message },
            {
              onSuccess: (entry) => {
                setPreview(entry);
                Toast.show({ type: 'success', text1: t('patient:records.replySent') });
              },
            },
          );
        }}
      />
    </View>
  );
}
