import { useTranslation } from 'react-i18next';

import { LabResultDetailView } from '@/features/clinical/lab-orders/components/LabResultDetailView';
import { useLabResultDetailQuery } from '@/features/clinical/lab-orders/hooks/usePatientLabResultQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';

export function LabResultDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const { data: labResult, isLoading, isError, refetch } = useLabResultDetailQuery(id ?? '');

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !labResult) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('labResult.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  return <LabResultDetailView labResult={labResult} />;
}
