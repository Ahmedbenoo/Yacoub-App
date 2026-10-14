import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NursingRequestSummary } from '@/features/nursing/components/NursingRequestSummary';
import { useNursingRequestQuery } from '@/features/nursing/hooks/useNursingQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { useRouteIdParam } from '@/shared/navigation/routes';

export function PatientNursingDetailScreen() {
  const { t } = useTranslation('nursing');
  const id = useRouteIdParam();
  const { data, isLoading } = useNursingRequestQuery(id);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('title')} />
      <View className="py-4">
        {isLoading || !data ? (
          <Spinner />
        ) : (
          <NursingRequestSummary request={data} />
        )}
      </View>
    </Screen>
  );
}
