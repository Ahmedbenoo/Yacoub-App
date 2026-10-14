import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useBranchOptions, useCreateDoctorMutation, useSpecialtyOptions } from '@/features/admin/hooks';
import { resolveBranchName } from '@/features/admin/lib/branches';
import {
  createDoctorSchema,
  parseCommaList,
  type CreateDoctorFormData,
} from '@/features/admin/schemas/admin.schemas';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { useActiveClinicQuery } from '@/features/clinic/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';
import { StaffAccessSentCard } from '@/features/admin/components/StaffAccessSentCard';
import { phoneToStaffEmail } from '@/shared/lib/phone';
import { getAdminDoctorHref } from '@/shared/navigation/routes';

export function AdminCreateDoctorScreen() {
  const { t } = useTranslation('admin');
  const { t: tPatient } = useTranslation('patient');
  const branchOptions = useBranchOptions();
  const specialtyOptions = useSpecialtyOptions();
  const createDoctor = useCreateDoctorMutation();
  const { data: clinic } = useActiveClinicQuery();
  const lockedSpecialty = clinic?.specialty;
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [createdDoctorId, setCreatedDoctorId] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<CreateDoctorFormData>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      specialty: lockedSpecialty ?? '',
      branchId: '',
      languages: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (lockedSpecialty) setValue('specialty', lockedSpecialty);
  }, [lockedSpecialty, setValue]);

  const onSubmit = (data: CreateDoctorFormData) => {
    const specialty = lockedSpecialty || data.specialty;
    createDoctor.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: phoneToStaffEmail(data.phone, 'doctor'),
        phone: data.phone.trim(),
        specialty,
        branchName: lockedSpecialty ? clinic?.name ?? specialty : resolveBranchName(data.branchId || ''),
        languages: parseCommaList(data.languages),
        bio: data.bio?.trim() || undefined,
      },
      {
        onSuccess: (doctor) => {
          if (doctor.credentialsWhatsApp) {
            setCreatedDoctorId(doctor.id);
            setSentMessage(doctor.credentialsWhatsApp);
            return;
          }
          router.replace(getAdminDoctorHref(doctor.id));
        },
      },
    );
  };

  if (sentMessage) {
    return (
      <Screen scroll className="px-5">
        <Header showBack title={t('doctors.createTitle')} />
        <View className="py-4">
          <StaffAccessSentCard
            message={sentMessage}
            onDone={() => createdDoctorId && router.replace(getAdminDoctorHref(createdDoctorId))}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('doctors.createTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="firstName" label={t('doctors.firstName')} />
          <FormInput control={control} name="lastName" label={t('doctors.lastName')} />
          <FormInput control={control} name="phone" label={t('doctors.phone')} keyboardType="phone-pad" />
          <Text variant="bodySm" muted>
            {t('staffAccess.hint')}
          </Text>
          {lockedSpecialty ? (
            <View className="gap-1">
              <Text variant="label" muted>
                {t('doctors.specialtyLabel')}
              </Text>
              <Text variant="body">{formatSpecialty(lockedSpecialty, tPatient)}</Text>
            </View>
          ) : (
            <FormSelect
              control={control}
              name="specialty"
              label={t('doctors.specialtyLabel')}
              placeholder={t('doctors.specialtyPlaceholder')}
              options={specialtyOptions}
              searchable
            />
          )}
          {lockedSpecialty ? null : (
            <FormSelect
              control={control}
              name="branchId"
              label={t('doctors.branch')}
              placeholder={t('branches.placeholder')}
              options={branchOptions}
            />
          )}
          <FormInput control={control} name="languages" label={t('doctors.languagesHint')} />
          <FormInput control={control} name="bio" label={t('doctors.about')} />
        </Card>

        <Button
          title={createDoctor.isPending ? t('doctors.creating') : t('doctors.createAction')}
          testID="admin-create-doctor-submit"
          onPress={handleSubmit(onSubmit)}
          loading={createDoctor.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
