import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useCreatePatientMutation } from '@/features/admin/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FormInput } from '@/shared/components/form/FormInput';
import { isValidPhone, phoneToPlaceholderEmail } from '@/shared/lib/phone';
import { getSecretaryBookHref } from '@/shared/navigation/routes';
import { Gender } from '@/shared/types/enums';

const secretaryCreatePatientSchema = z.object({
  firstName: z.string().min(2, 'firstNameMin'),
  lastName: z.string().min(2, 'lastNameMin'),
  phone: z.string().refine(isValidPhone, 'invalidPhone'),
});

type SecretaryCreatePatientForm = z.infer<typeof secretaryCreatePatientSchema>;

export function SecretaryCreatePatientScreen() {
  const { t } = useTranslation('secretary');
  const createPatient = useCreatePatientMutation();

  const { control, handleSubmit } = useForm<SecretaryCreatePatientForm>({
    resolver: zodResolver(secretaryCreatePatientSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  });

  const onSubmit = (data: SecretaryCreatePatientForm) => {
    createPatient.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: phoneToPlaceholderEmail(data.phone),
        dateOfBirth: '1990-01-01',
        gender: Gender.OTHER,
        allergies: [],
        chronicConditions: [],
      },
      {
        onSuccess: (patient) => router.replace(getSecretaryBookHref(patient.id)),
      },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('patients.createTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="phone" label={t('patients.phone')} keyboardType="phone-pad" />
          <FormInput control={control} name="firstName" label={t('patients.firstName')} />
          <FormInput control={control} name="lastName" label={t('patients.lastName')} />
        </Card>

        <Button
          title={t('patients.create')}
          onPress={handleSubmit(onSubmit)}
          loading={createPatient.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
