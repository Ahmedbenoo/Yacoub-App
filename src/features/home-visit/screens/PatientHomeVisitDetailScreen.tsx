import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeVisitSummary } from '@/features/home-visit/components/HomeVisitSummary';
import { useHomeVisitQuery } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { HomeVisitStatus } from '@/shared/types/enums';

export function PatientHomeVisitDetailScreen() {
  const { t } = useTranslation('homeVisit');
  const id = useRouteIdParam();
  const { data, isLoading } = useHomeVisitQuery(id);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('title')} />
      <View className="gap-4 py-4">
        {isLoading || !data ? (
          <Spinner />
        ) : (
          <>
            <HomeVisitSummary request={data} />
            {data.status === HomeVisitStatus.REQUESTED ? (
              <Text variant="bodySm" muted>
                {t('waitingDoctor')}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
