import { View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import {
  createPatientSchema,
  parseCommaList,
  type CreatePatientFormData,
} from '@/features/admin/schemas/admin.schemas';
import { useCreatePatientMutation } from '@/features/admin/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { getAdminPatientHref } from '@/shared/navigation/routes';
import { Gender } from '@/shared/types/enums';

export function AdminCreatePatientScreen() {
  const { t } = useTranslation('admin');
  const createPatient = useCreatePatientMutation();

  const { control, handleSubmit } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'female',
      bloodType: '',
      allergies: '',
      chronicConditions: '',
    },
  });

  const onSubmit = (data: CreatePatientFormData) => {
    createPatient.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        dateOfBirth: data.dateOfBirth.trim(),
        gender: data.gender as Gender,
        bloodType: data.bloodType?.trim() || undefined,
        allergies: parseCommaList(data.allergies),
        chronicConditions: parseCommaList(data.chronicConditions),
      },
      {
        onSuccess: (patient) => router.replace(getAdminPatientHref(patient.id)),
      },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('patients.createTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="firstName" label={t('patients.firstName')} />
          <FormInput control={control} name="lastName" label={t('patients.lastName')} />
          <FormInput
            control={control}
            name="email"
            label={t('patients.email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput control={control} name="phone" label={t('patients.phone')} keyboardType="phone-pad" />
          <FormInput
            control={control}
            name="dateOfBirth"
            label={t('patients.dateOfBirth')}
            placeholder={t('patients.dateOfBirthPlaceholder')}
          />
          <View className="gap-2">
            <Text variant="label">{t('patients.gender')}</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange } }) => (
                <SegmentedControl
                  options={[
                    { value: 'female', label: t('patients.genderFemale') },
                    { value: 'male', label: t('patients.genderMale') },
                    { value: 'other', label: t('patients.genderOther') },
                  ]}
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </View>
          <FormInput control={control} name="bloodType" label={t('patients.bloodType')} />
          <FormInput control={control} name="allergies" label={t('patients.allergiesHint')} />
          <FormInput control={control} name="chronicConditions" label={t('patients.conditionsHint')} />
        </Card>

        <Button
          title={createPatient.isPending ? t('patients.creating') : t('patients.createAction')}
          testID="admin-create-patient-submit"
          onPress={handleSubmit(onSubmit)}
          loading={createPatient.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
