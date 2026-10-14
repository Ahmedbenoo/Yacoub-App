import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { addClinicSchema } from '@/features/admin/schemas/admin.schemas';
import { useSpecialtyOptions } from '@/features/admin/hooks';
import { useAddOwnerClinicMutation } from '@/features/clinic/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';

type AddClinicForm = z.infer<typeof addClinicSchema>;

export function AdminAddClinicScreen() {
  const { t } = useTranslation('admin');
  const specialtyOptions = useSpecialtyOptions();
  const addClinic = useAddOwnerClinicMutation();
  const { control, handleSubmit } = useForm<AddClinicForm>({
    resolver: zodResolver(addClinicSchema),
    defaultValues: {
      name: '',
      phone: '',
      street: '',
      city: '',
      locationUrl: '',
      specialty: '',
    },
  });

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('clinic.createTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="name" label={t('clinic.name')} />
          <FormSelect
            control={control}
            name="specialty"
            label={t('clinic.specialty')}
            placeholder={t('doctors.specialtyPlaceholder')}
            options={specialtyOptions}
            searchable
          />
          <FormInput control={control} name="phone" label={t('doctors.phone')} keyboardType="phone-pad" />
          <FormInput control={control} name="city" label={t('clinic.city')} />
          <FormInput control={control} name="street" label={t('clinic.street')} />
          <FormInput
            control={control}
            name="locationUrl"
            label={t('clinic.locationUrl')}
            autoCapitalize="none"
          />
        </Card>

        <Button
          title={addClinic.isPending ? t('clinic.creating') : t('clinic.createAction')}
          onPress={handleSubmit((data) =>
            addClinic.mutate(
              {
                name: data.name.trim(),
                phone: data.phone.trim(),
                street: data.street.trim(),
                city: data.city.trim(),
                locationUrl: data.locationUrl?.trim() || undefined,
                specialty: data.specialty,
              },
              { onSuccess: () => router.back() },
            ),
          )}
          loading={addClinic.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
