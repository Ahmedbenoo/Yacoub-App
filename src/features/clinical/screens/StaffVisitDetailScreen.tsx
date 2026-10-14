import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ObgynSummaryCard } from '@/features/obgyn/components/ObgynSummaryCard';
import { formatDisplayDateTime } from '@/shared/lib/datetime';
import { useStaffVisitQuery } from '@/features/clinical/hooks/useClinicalQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export function StaffVisitDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const { data: visit, isLoading, isError, refetch } = useStaffVisitQuery(id ?? '');

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

  return (
    <Screen scroll className="px-5">
      <Header showBack />

      <View className="gap-4 py-4">
        <View className="gap-1">
          <Text variant="titleLg">{t('visit.title')}</Text>
          <Text variant="bodySm" muted>
            {formatDisplayDateTime(visitDate, locale)}
          </Text>
        </View>

        <Card className="gap-4">
          <DetailRow label={t('visit.doctor')} value={visit.doctorName} />
          {visit.chiefComplaint && (
            <DetailRow label={t('visit.chiefComplaint')} value={visit.chiefComplaint} />
          )}
          {visit.diagnosis && <DetailRow label={t('visit.diagnosis')} value={visit.diagnosis} />}
          {visit.symptoms && <DetailRow label={t('visit.symptoms')} value={visit.symptoms} />}
          {visit.notes && <DetailRow label={t('visit.notes')} value={visit.notes} />}
        </Card>

        <ObgynSummaryCard visitId={visit.id} audience="staff" />

        {visit.vitals && (
          <Card className="gap-3">
            <Text variant="label">{t('visit.vitals')}</Text>
            {visit.vitals.bloodPressure && (
              <DetailRow label={t('visit.bloodPressure')} value={visit.vitals.bloodPressure} />
            )}
            {visit.vitals.heartRate != null && (
              <DetailRow
                label={t('visit.heartRate')}
                value={t('visit.heartRateValue', { value: visit.vitals.heartRate })}
              />
            )}
          </Card>
        )}
      </View>
    </Screen>
  );
}
