import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useBranchOptions, useSpecialtyOptions, useUpdateDoctorMutation } from '@/features/admin/hooks';
import { getBranchByName, resolveBranchName } from '@/features/admin/lib/branches';
import {
  parseCommaList,
  updateDoctorSchema,
  type UpdateDoctorFormData,
} from '@/features/admin/schemas/admin.schemas';
import { useDoctorDetailQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';

export function AdminEditDoctorScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const branchOptions = useBranchOptions();
  const specialtyOptions = useSpecialtyOptions();
  const { data: doctor, isLoading, isError, refetch } = useDoctorDetailQuery(id ?? '');
  const updateDoctor = useUpdateDoctorMutation();

  const { control, handleSubmit } = useForm<UpdateDoctorFormData>({
    resolver: zodResolver(updateDoctorSchema),
    values: doctor
      ? {
          specialty: doctor.specialty,
          phone: doctor.phone ?? '',
          bio: doctor.bio ?? '',
          branchId: getBranchByName(doctor.branchName)?.id ?? '',
          languages: doctor.languages.join(', '),
          sharePercent: String(doctor.sharePercent ?? 60),
        }
      : undefined,
  });

  if (isLoading && !doctor) {
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

  const onSubmit = (data: UpdateDoctorFormData) => {
    updateDoctor.mutate(
      {
        id: doctor.id,
        payload: {
          specialty: data.specialty,
          phone: data.phone?.trim() || undefined,
          bio: data.bio?.trim() || undefined,
          branchName: resolveBranchName(data.branchId),
          languages: parseCommaList(data.languages),
          sharePercent: Number(data.sharePercent),
        },
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('doctors.editTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormSelect
            control={control}
            name="specialty"
            label={t('doctors.specialtyLabel')}
            placeholder={t('doctors.specialtyPlaceholder')}
            options={specialtyOptions}
            searchable
          />
          <FormInput control={control} name="phone" label={t('doctors.phone')} keyboardType="phone-pad" />
          <FormSelect
            control={control}
            name="branchId"
            label={t('doctors.branch')}
            placeholder={t('branches.placeholder')}
            options={branchOptions}
          />
          <FormInput control={control} name="languages" label={t('doctors.languagesHint')} />
          <FormInput
            control={control}
            name="sharePercent"
            label={t('doctors.share')}
            keyboardType="number-pad"
            placeholder="60"
          />
          <FormInput control={control} name="bio" label={t('doctors.about')} />
        </Card>

        <Button
          title={updateDoctor.isPending ? t('doctors.saving') : t('doctors.save')}
          testID="admin-edit-doctor-submit"
          onPress={handleSubmit(onSubmit)}
          loading={updateDoctor.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
