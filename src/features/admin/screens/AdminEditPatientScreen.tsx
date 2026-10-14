import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import {
  parseCommaList,
  updatePatientSchema,
  type UpdatePatientFormData,
} from '@/features/admin/schemas/admin.schemas';
import { useUpdatePatientMutation } from '@/features/admin/hooks';
import { usePatientDetailQuery } from '@/features/patients/hooks/usePatientQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FormInput } from '@/shared/components/form/FormInput';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';

export function AdminEditPatientScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const { data: patient, isLoading, isError, refetch } = usePatientDetailQuery(id ?? '');
  const updatePatient = useUpdatePatientMutation();

  const { control, handleSubmit } = useForm<UpdatePatientFormData>({
    resolver: zodResolver(updatePatientSchema),
    values: patient
      ? {
          phone: patient.phone ?? '',
          email: patient.email ?? '',
          allergies: patient.allergies.join(', '),
          chronicConditions: patient.chronicConditions.join(', '),
        }
      : undefined,
  });

  if (isLoading && !patient) {
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
        <ErrorState message={t('patients.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const onSubmit = (data: UpdatePatientFormData) => {
    updatePatient.mutate(
      {
        id: patient.id,
        payload: {
          phone: data.phone?.trim() || undefined,
          email: data.email?.trim() || undefined,
          allergies: parseCommaList(data.allergies),
          chronicConditions: parseCommaList(data.chronicConditions),
        },
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('patients.editTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="phone" label={t('patients.phone')} keyboardType="phone-pad" />
          <FormInput control={control} name="email" label={t('patients.email')} keyboardType="email-address" autoCapitalize="none" />
          <FormInput control={control} name="allergies" label={t('patients.allergiesHint')} />
          <FormInput control={control} name="chronicConditions" label={t('patients.conditionsHint')} />
        </Card>

        <Button
          title={updatePatient.isPending ? t('patients.saving') : t('patients.save')}
          onPress={handleSubmit(onSubmit)}
          loading={updatePatient.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
