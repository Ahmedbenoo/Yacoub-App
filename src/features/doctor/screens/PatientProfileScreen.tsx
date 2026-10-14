import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { MedicalHistoryList } from '@/features/doctor/components/MedicalHistoryList';
import { PregnancyPanel } from '@/features/obgyn/components/PregnancyPanel';
import { isObstetricsGynecology } from '@/features/obgyn/lib/specialty';
import { useDoctorDetailQuery } from '@/features/patient/hooks/useDoctorsQueries';
import { useStartVisitMutation } from '@/features/doctor/hooks';
import {
  usePatientDetailQuery,
  usePatientHistoryQuery,
} from '@/features/patients/hooks/usePatientQueries';
import {
  formatPatientSubtitle,
  getFullName,
} from '@/features/doctor/lib/formatters';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ProfileHeroCard } from '@/shared/components/profile/ProfileHeroCard';
import { ProfileInfoRow } from '@/shared/components/profile/ProfileInfoRow';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { getVisitHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

export function PatientProfileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation(['doctor', 'common']);
  const viewerId = useAuthStore((s) => s.user?.id);
  const viewer = useDoctorDetailQuery(viewerId ?? '');
  const showPregnancy = isObstetricsGynecology(viewer.data?.specialty);

  const { data: patient, isLoading, isError, refetch } = usePatientDetailQuery(id);
  const { data: history, isLoading: historyLoading } = usePatientHistoryQuery(id);
  const startVisit = useStartVisitMutation();

  if (isLoading) {
    return (
      <Screen>
        <Header showBack />
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !patient) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('doctor:patients.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const handleStartVisit = () => {
    startVisit.mutate(
      { patientId: patient.id },
      {
        onSuccess: (visit) => router.push(getVisitHref(UserRole.DOCTOR, visit.id)),
      },
    );
  };

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack />

      <View className="gap-4 pb-10">
        <ProfileHeroCard
          firstName={patient.firstName}
          lastName={patient.lastName}
          avatarUrl={patient.avatarUrl}
          title={getFullName(patient.firstName, patient.lastName)}
          subtitle={formatPatientSubtitle(
            patient.dateOfBirth,
            patient.gender,
            patient.bloodType,
            t('common:patientAgeGender'),
          )}
          badges={
            patient.chronicConditions.length > 0
              ? patient.chronicConditions.map((condition) => (
                  <Badge key={condition} label={condition} variant="info" />
                ))
              : undefined
          }
        />

        <Card className="gap-0 px-4 py-1">
          {patient.phone && <ProfileInfoRow label={t('doctor:patients.phone')} value={patient.phone} />}
          {patient.email && <ProfileInfoRow label={t('doctor:patients.email')} value={patient.email} />}
          <ProfileInfoRow
            label={t('doctor:patients.allergies')}
            value={patient.allergies.length ? patient.allergies.join(', ') : t('doctor:patients.none')}
          />
          <ProfileInfoRow
            label={t('doctor:patients.conditions')}
            value={
              patient.chronicConditions.length
                ? patient.chronicConditions.join(', ')
                : t('doctor:patients.none')
            }
          />
        </Card>

        <Button
          title={t('doctor:visit.startVisit')}
          onPress={handleStartVisit}
          loading={startVisit.isPending}
          fullWidth
          size="lg"
        />

        {showPregnancy ? <PregnancyPanel patientId={patient.id} /> : null}

        <View className="gap-3">
          <Text variant="titleSm">{t('doctor:patients.medicalHistory')}</Text>
          {historyLoading ? (
            <Spinner />
          ) : (
            <MedicalHistoryList entries={history ?? []} viewerRole={UserRole.DOCTOR} />
          )}
        </View>
      </View>
    </Screen>
  );
}
