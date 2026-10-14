import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useDeactivatePatientMutation, useReactivatePatientMutation } from '@/features/admin/hooks';
import { MedicalHistoryList } from '@/features/doctor/components/MedicalHistoryList';
import { usePatientDetailQuery, usePatientHistoryQuery } from '@/features/patients/hooks/usePatientQueries';
import { formatPatientSubtitle, getFullName } from '@/features/doctor/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ProfileHeroCard } from '@/shared/components/profile/ProfileHeroCard';
import { ProfileInfoRow } from '@/shared/components/profile/ProfileInfoRow';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { getAdminPatientEditHref, useRouteIdParam } from '@/shared/navigation/routes';
import { UserRole } from '@/shared/types/enums';

export function AdminPatientDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation(['admin', 'common']);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: patient, isLoading, isError, refetch } = usePatientDetailQuery(id ?? '');
  const { data: history, isLoading: historyLoading } = usePatientHistoryQuery(id ?? '');
  const deactivatePatient = useDeactivatePatientMutation();
  const reactivatePatient = useReactivatePatientMutation();
  const isActive = patient?.isActive !== false;

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !patient) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('admin:patients.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const handleDeactivate = () => {
    deactivatePatient.mutate(patient.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        router.back();
      },
    });
  };

  const handleReactivate = () => {
    reactivatePatient.mutate(patient.id);
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
            <>
              {patient.chronicConditions.length > 0 &&
                patient.chronicConditions.map((condition) => (
                  <Badge key={condition} label={condition} variant="info" />
                ))}
              {!isActive && <Badge label={t('admin:patients.inactive')} variant="warning" />}
            </>
          }
        />

        <Card className="gap-0 px-4 py-1">
          {patient.phone && <ProfileInfoRow label={t('admin:patients.phone')} value={patient.phone} />}
          {patient.email && <ProfileInfoRow label={t('admin:patients.email')} value={patient.email} />}
          <ProfileInfoRow
            label={t('admin:patients.allergies')}
            value={patient.allergies.length ? patient.allergies.join(', ') : t('admin:patients.none')}
          />
          <ProfileInfoRow
            label={t('admin:patients.conditions')}
            value={
              patient.chronicConditions.length
                ? patient.chronicConditions.join(', ')
                : t('admin:patients.none')
            }
          />
        </Card>

        {isActive && (
          <>
            <Button
              title={t('admin:patients.editTitle')}
              variant="outline"
              onPress={() => router.push(getAdminPatientEditHref(patient.id))}
              fullWidth
            />
            <Button
              title={t('admin:patients.deactivateTitle')}
              variant="danger"
              testID="admin-deactivate-patient"
              onPress={() => setConfirmVisible(true)}
              fullWidth
            />
          </>
        )}

        {!isActive && (
          <Button
            title={t('admin:patients.reactivateTitle')}
            testID="admin-reactivate-patient"
            onPress={handleReactivate}
            loading={reactivatePatient.isPending}
            fullWidth
            size="lg"
          />
        )}

        <View className="gap-3">
          <Text variant="titleSm">{t('admin:patients.medicalHistory')}</Text>
          {historyLoading ? (
            <Spinner />
          ) : (
            <MedicalHistoryList entries={history ?? []} viewerRole={UserRole.ADMIN} />
          )}
        </View>

        <ConfirmDialog
          visible={confirmVisible}
          title={t('admin:patients.deactivateTitle')}
          message={t('admin:patients.deactivateMessage', {
            name: getFullName(patient.firstName, patient.lastName),
          })}
          confirmLabel={t('admin:patients.deactivateConfirm')}
          destructive
          loading={deactivatePatient.isPending}
          onConfirm={handleDeactivate}
          onCancel={() => setConfirmVisible(false)}
        />
      </View>
    </Screen>
  );
}
