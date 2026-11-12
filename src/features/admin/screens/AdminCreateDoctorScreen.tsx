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
import { formatPhoneForDisplay, phoneToStaffEmail } from '@/shared/lib/phone';
import { buildStaffWelcomeMessage } from '@/shared/lib/staff-welcome';
import { getAdminDoctorHref } from '@/shared/navigation/routes';

export function AdminCreateDoctorScreen() {
  const { t } = useTranslation('admin');
  const { t: tPatient } = useTranslation('patient');
  const branchOptions = useBranchOptions();
  const specialtyOptions = useSpecialtyOptions();
  const createDoctor = useCreateDoctorMutation();
  const { data: clinic } = useActiveClinicQuery();
  const lockedSpecialty = clinic?.specialty;
  const [access, setAccess] = useState<{
    message: string;
    phone: string;
    username: string;
    password: string;
    doctorId: string;
  } | null>(null);

  const { control, handleSubmit, setValue } = useForm<CreateDoctorFormData>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
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
    const password = data.password.trim();
    const phone = data.phone.trim();
    createDoctor.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: phoneToStaffEmail(phone, 'doctor'),
        phone,
        password,
        specialty,
        branchName: lockedSpecialty ? clinic?.name ?? specialty : resolveBranchName(data.branchId || ''),
        languages: parseCommaList(data.languages),
        bio: data.bio?.trim() || undefined,
      },
      {
        onSuccess: (doctor) => {
          if (doctor.linkedExisting) {
            router.replace(getAdminDoctorHref(doctor.id));
            return;
          }
          const username = formatPhoneForDisplay(phone);
          setAccess({
            doctorId: doctor.id,
            phone,
            username,
            password,
            message:
              doctor.credentialsWhatsApp ||
              buildStaffWelcomeMessage({
                role: 'doctor',
                personName: `${data.firstName} ${data.lastName}`.trim(),
                clinicName: clinic?.nameAr || clinic?.name || 'العيادة',
                phone,
                password,
              }),
          });
        },
      },
    );
  };

  if (access) {
    return (
      <Screen scroll className="px-5">
        <Header showBack title={t('doctors.createTitle')} />
        <View className="py-4">
          <StaffAccessSentCard
            message={access.message}
            phone={access.phone}
            username={access.username}
            password={access.password}
            onDone={() => router.replace(getAdminDoctorHref(access.doctorId))}
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
          <FormInput
            control={control}
            name="phone"
            label={t('doctors.phone')}
            helper={t('staffAccess.usernameHint')}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <FormInput
            control={control}
            name="password"
            label={t('doctors.password')}
            secureTextEntry
            autoComplete="password"
          />
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
