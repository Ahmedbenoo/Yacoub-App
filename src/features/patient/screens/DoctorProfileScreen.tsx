import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useDoctorDetailQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { formatDoctorTitle } from '@/features/patient/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { DoctorProfileContent } from '@/shared/components/profile/DoctorProfileContent';
import { Button } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { getPatientDoctorBookHref, useRouteIdParam } from '@/shared/navigation/routes';

export function DoctorProfileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');

  const { data: doctor, isLoading, isError, refetch } = useDoctorDetailQuery(id ?? '');

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !doctor) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('search.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={formatDoctorTitle(doctor.firstName, doctor.lastName, t)} />

      <View className="gap-4 pb-10">
        <DoctorProfileContent doctor={doctor} />
        <Button
          title={t('booking.bookAppointment')}
          testID="patient-book-appointment"
          onPress={() => router.push(getPatientDoctorBookHref(doctor.id))}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
