import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedicalHistoryList } from '@/features/doctor/components/MedicalHistoryList';
import { usePatientDetailQuery, usePatientHistoryQuery } from '@/features/patients/hooks/usePatientQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { getSecretaryBookHref, useRouteIdParam } from '@/shared/navigation/routes';
import { UserRole } from '@/shared/types/enums';

export function SecretaryPatientDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('secretary');
  const { t: tc } = useTranslation('common');

  const { data: patient, isLoading, isError, refetch } = usePatientDetailQuery(id);
  const { data: history, isLoading: historyLoading } = usePatientHistoryQuery(id);

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !patient) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('book.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  const prescriptionEntries = (history ?? []).filter((entry) => entry.type === 'prescription');

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('patients.profileTitle')} />

      <View className="gap-4 pb-10">
        <Card className="gap-1">
          <Text variant="titleSm">
            {patient.firstName} {patient.lastName}
          </Text>
          {patient.phone ? (
            <Text variant="bodySm" muted>
              {patient.phone}
            </Text>
          ) : null}
        </Card>

        <Button
          title={t('patients.bookAppointment')}
          onPress={() => router.push(getSecretaryBookHref(patient.id))}
          fullWidth
        />

        <View className="gap-3">
          <Text variant="titleSm">{t('patients.prescriptions')}</Text>
          {historyLoading ? (
            <Spinner />
          ) : prescriptionEntries.length ? (
            <MedicalHistoryList entries={prescriptionEntries} viewerRole={UserRole.SECRETARY} />
          ) : (
            <Text variant="bodySm" muted>
              {t('patients.emptyPrescriptions')}
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
