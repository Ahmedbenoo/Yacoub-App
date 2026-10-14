import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HomeVisitCard } from '@/features/home-visit/components/HomeVisitCard';
import { useDoctorHomeVisitsQuery } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { useAuthStore } from '@/shared/stores';

export function DoctorHomeVisitListScreen() {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');
  const doctorId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useDoctorHomeVisitsQuery(doctorId);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('doctorListTitle')} />
      <View className="gap-4 py-4">
        {isLoading ? <Spinner /> : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState title={t('doctorEmptyTitle')} description={t('doctorEmptyDescription')} />
        ) : null}
        {data?.map((request) => (
          <HomeVisitCard
            key={request.id}
            request={request}
            title={`${request.patientName} · ${formatSpecialty(request.specialty, tPatient)}`}
            onPress={() => router.push(`/(doctor)/home-visits/${request.id}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
