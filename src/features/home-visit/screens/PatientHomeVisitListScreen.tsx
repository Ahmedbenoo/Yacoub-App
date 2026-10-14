import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HomeVisitCard } from '@/features/home-visit/components/HomeVisitCard';
import { usePatientHomeVisitsQuery } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/stores';

export function PatientHomeVisitListScreen() {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = usePatientHomeVisitsQuery(userId);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('myRequests')} />
      <View className="gap-4 py-4">
        <Button title={t('requestAction')} onPress={() => router.push('/(patient)/home-visit/new' as never)} fullWidth />
        {isLoading ? <Spinner /> : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : null}
        {data?.map((request) => (
          <HomeVisitCard
            key={request.id}
            request={request}
            title={formatSpecialty(request.specialty, tPatient)}
            onPress={() => router.push(`/(patient)/home-visit/${request.id}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
