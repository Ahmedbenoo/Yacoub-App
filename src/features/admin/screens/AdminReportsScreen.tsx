import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ReportsList } from '@/features/admin/components/ReportsList';
import { useClinicReportsQuery } from '@/features/admin/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';

export function AdminReportsScreen() {
  const { t } = useTranslation('admin');
  const { data: reports, isLoading, isError, refetch } = useClinicReportsQuery();

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('reports.listTitle')} />

      <View className="gap-4 py-4">
        {isLoading && <Spinner />}
        {isError && <ErrorState message={t('reports.error')} onRetry={() => refetch()} />}
        {reports && reports.length === 0 && (
          <Text variant="bodySm" muted>
            {t('reports.empty')}
          </Text>
        )}
        {reports && reports.length > 0 && <ReportsList reports={reports} />}
      </View>
    </Screen>
  );
}
