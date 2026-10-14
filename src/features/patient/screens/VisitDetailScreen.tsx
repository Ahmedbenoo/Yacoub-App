import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ObgynSummaryCard } from '@/features/obgyn/components/ObgynSummaryCard';
import { useVisitAttachmentsQuery } from '@/features/obgyn/hooks/useObgynQueries';
import { formatDisplayDateTime } from '@/shared/lib/datetime';
import { useVisitDetailQuery } from '@/features/clinical/visits/hooks/usePatientVisitQueries';
import { Header } from '@/shared/components/layout/Header';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { getPatientLabResultsHref, getPatientPrescriptionsHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';

function DetailRow({ label, value, divided }: { label: string; value: string; divided?: boolean }) {
  return (
    <View className={`gap-1 ${divided ? 'border-t border-slate-100 pt-3 dark:border-slate-700' : ''}`}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function VitalTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="gap-1 rounded-2xl bg-primary-50 px-3 py-3 dark:bg-primary-900/20"
      style={{ width: '48%' }}
    >
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="titleSm">{value}</Text>
    </View>
  );
}

export function VisitDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const isDark = useResolvedColorScheme() === 'dark';
  const { data: visit, isLoading, isError, refetch } = useVisitDetailQuery(id ?? '');
  const attachments = useVisitAttachmentsQuery(id ?? '', Boolean(id));

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !visit) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('visit.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  const visitDate = visit.completedAt ?? visit.startedAt;
  const vitals = [
    visit.vitals?.bloodPressure
      ? { label: t('visit.bloodPressure'), value: visit.vitals.bloodPressure }
      : null,
    visit.vitals?.heartRate != null
      ? { label: t('visit.heartRate'), value: t('visit.heartRateValue', { value: visit.vitals.heartRate }) }
      : null,
    visit.vitals?.temperature != null
      ? { label: t('visit.temperature'), value: t('visit.temperatureValue', { value: visit.vitals.temperature }) }
      : null,
    visit.vitals?.weight != null
      ? { label: t('visit.weight'), value: t('visit.weightValue', { value: visit.vitals.weight }) }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('visit.title')} />

      <View className="gap-4 py-4">
        <Text variant="bodySm" muted>
          {formatDisplayDateTime(visitDate, locale)}
        </Text>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
              <Icon name="doctors" size={22} color="#0D9488" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="caption" muted>
                {t('visit.doctor')}
              </Text>
              <Text variant="titleSm">{visit.doctorName}</Text>
            </View>
          </View>
          {visit.chiefComplaint ? (
            <DetailRow divided label={t('visit.chiefComplaint')} value={visit.chiefComplaint} />
          ) : null}
          {visit.diagnosis ? <DetailRow divided label={t('visit.diagnosis')} value={visit.diagnosis} /> : null}
          {visit.symptoms ? <DetailRow divided label={t('visit.symptoms')} value={visit.symptoms} /> : null}
          {visit.notes ? <DetailRow divided label={t('visit.notes')} value={visit.notes} /> : null}
        </Card>

        <ObgynSummaryCard visitId={visit.id} audience="patient" />

        {(attachments.data ?? []).map((file) => (
          <Image key={file.id} source={{ uri: file.dataUrl }} style={{ height: 160, width: '100%' }} resizeMode="contain" />
        ))}

        {vitals.length > 0 ? (
          <View className="gap-3">
            <Text variant="label">{t('visit.vitals')}</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {vitals.map((item) => (
                <VitalTile key={item.label} label={item.label} value={item.value} />
              ))}
            </View>
          </View>
        ) : null}

        {(visit.linkedPrescriptionIds.length > 0 || visit.linkedLabResultIds.length > 0) && (
          <Card className="gap-3">
            <Text variant="label">{t('visit.relatedRecords')}</Text>
            {visit.linkedPrescriptionIds.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(getPatientPrescriptionsHref(visit.id))}
                className="active:opacity-80"
              >
                <Row className={`items-center gap-3 rounded-xl px-4 py-3 ${themeBg(isDark, 'bg-slate-50', 'bg-slate-800')}`}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <Icon name="records" size={16} color="#0D9488" />
                  </View>
                  <Text variant="bodySm" className="min-w-0 flex-1">
                    {t('visit.openPrescriptions')}
                  </Text>
                  <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={16} color="#94A3B8" />
                </Row>
              </Pressable>
            ) : null}
            {visit.linkedLabResultIds.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(getPatientLabResultsHref(visit.id))}
                className="active:opacity-80"
              >
                <Row className={`items-center gap-3 rounded-xl px-4 py-3 ${themeBg(isDark, 'bg-slate-50', 'bg-slate-800')}`}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <Icon name="clinic" size={16} color="#0D9488" />
                  </View>
                  <Text variant="bodySm" className="min-w-0 flex-1">
                    {t('visit.openLabResults')}
                  </Text>
                  <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={16} color="#94A3B8" />
                </Row>
              </Pressable>
            ) : null}
          </Card>
        )}
      </View>
    </Screen>
  );
}
