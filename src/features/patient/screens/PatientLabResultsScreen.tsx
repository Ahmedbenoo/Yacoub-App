import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LabResultSummary } from '@/features/clinical/lab-orders/components/LabResultSummary';
import { useMyLabResultsQuery } from '@/features/clinical/lab-orders/hooks/usePatientLabResultQueries';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { LabRequestStatus } from '@/shared/types/enums';
import { getPatientLabResultHref, getRouteParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

export function PatientLabResultsScreen() {
  const { visitId: visitIdParam } = useLocalSearchParams<{ visitId?: string | string[] }>();
  const visitId = getRouteParam(visitIdParam);
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const { data, isLoading, isError, refetch } = useMyLabResultsQuery();

  const results = (data ?? []).filter((item) => !visitId || item.visitId === visitId);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('labResult.listTitle')} />
      <View className="gap-3 py-4">
        {isLoading ? <Spinner /> : null}
        {isError ? (
          <ErrorState message={t('labResult.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
        ) : null}
        {!isLoading && !isError && results.length === 0 ? (
          <EmptyState title={t('labResult.emptyTitle')} description={t('labResult.emptyDescription')} />
        ) : null}
        {results.map((result) => (
          <Pressable
            key={result.id}
            accessibilityRole="button"
            onPress={() => router.push(getPatientLabResultHref(result.id))}
          >
            <Card className="gap-2">
              <View className="flex-row items-center gap-3">
                <View className="min-w-0 flex-1 gap-1">
                  <Text variant="titleSm">{result.testName}</Text>
                  <Text variant="bodySm" muted>
                    {formatDisplayDate(result.completedAt ?? result.requestedAt, locale)}
                  </Text>
                  {result.doctorName ? (
                    <Text variant="bodySm" muted>
                      {result.doctorName}
                    </Text>
                  ) : null}
                </View>
                <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" />
              </View>
              <Badge
                label={t(`labResult.status.${result.status}`)}
                variant={result.status === LabRequestStatus.COMPLETED ? 'success' : 'info'}
              />
              {result.resultSummary ? <LabResultSummary summary={result.resultSummary} /> : null}
              {result.notes ? (
                <Text variant="bodySm" muted>
                  {result.notes}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
