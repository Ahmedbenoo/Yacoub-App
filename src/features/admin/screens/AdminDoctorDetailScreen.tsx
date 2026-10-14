import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useDeactivateDoctorMutation, useReactivateDoctorMutation } from '@/features/admin/hooks';
import { useDoctorDetailQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { getFullName } from '@/features/patient/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { DoctorProfileContent } from '@/shared/components/profile/DoctorProfileContent';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { getAdminDoctorEditHref, getAdminDoctorScheduleHref, useRouteIdParam } from '@/shared/navigation/routes';

export function AdminDoctorDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: doctor, isLoading, isError, refetch } = useDoctorDetailQuery(id ?? '');
  const deactivateDoctor = useDeactivateDoctorMutation();
  const reactivateDoctor = useReactivateDoctorMutation();
  const isActive = doctor?.isActive !== false;

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
        <ErrorState message={t('doctors.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const handleDeactivate = () => {
    deactivateDoctor.mutate(doctor.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        router.back();
      },
    });
  };

  return (
    <Screen scroll padded={false} className="px-5">
      <Header
        showBack
        title={t('doctors.doctorTitle', { name: getFullName(doctor.firstName, doctor.lastName) })}
      />

      <View className="gap-4 pb-10">
        <DoctorProfileContent doctor={doctor} />

        <Button
          title={t('doctors.schedule')}
          onPress={() => router.push(getAdminDoctorScheduleHref(doctor.id))}
          fullWidth
        />

        {isActive ? (
          <>
            <Button
              title={t('doctors.editTitle')}
              variant="outline"
              onPress={() => router.push(getAdminDoctorEditHref(doctor.id))}
              fullWidth
            />
            <Button
              title={t('doctors.deactivateTitle')}
              variant="danger"
              testID="admin-deactivate-doctor"
              onPress={() => setConfirmVisible(true)}
              fullWidth
            />
          </>
        ) : (
          <Button
            title={t('doctors.reactivateTitle')}
            testID="admin-reactivate-doctor"
            onPress={() => reactivateDoctor.mutate(doctor.id)}
            loading={reactivateDoctor.isPending}
            fullWidth
            size="lg"
          />
        )}

        <ConfirmDialog
          visible={confirmVisible}
          title={t('doctors.deactivateTitle')}
          message={t('doctors.deactivateMessage', {
            name: getFullName(doctor.firstName, doctor.lastName),
          })}
          confirmLabel={t('doctors.deactivateConfirm')}
          destructive
          loading={deactivateDoctor.isPending}
          onConfirm={handleDeactivate}
          onCancel={() => setConfirmVisible(false)}
        />
      </View>
    </Screen>
  );
}
