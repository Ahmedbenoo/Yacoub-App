import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useAdminSecretaryQuery, useUpdateSecretaryMutation } from '@/features/admin/hooks';
import { updateSecretarySchema, type UpdateSecretaryFormData } from '@/features/admin/schemas/admin.schemas';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FormInput } from '@/shared/components/form/FormInput';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { useRouteIdParam } from '@/shared/navigation/routes';

export function AdminEditSecretaryScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const { data: secretary, isLoading, isError, refetch } = useAdminSecretaryQuery(id);
  const updateSecretary = useUpdateSecretaryMutation();
  const { control, handleSubmit } = useForm<UpdateSecretaryFormData>({
    resolver: zodResolver(updateSecretarySchema),
    values: secretary
      ? {
          firstName: secretary.firstName,
          lastName: secretary.lastName,
          phone: formatPhoneForDisplay(secretary.phone),
        }
      : undefined,
  });

  if (isLoading && !secretary) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !secretary) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('staff.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('secretary.editTitle')} />

      <View className="gap-4 py-4">
        <Card className="gap-4">
          <FormInput control={control} name="firstName" label={t('doctors.firstName')} />
          <FormInput control={control} name="lastName" label={t('doctors.lastName')} />
          <FormInput
            control={control}
            name="phone"
            label={t('doctors.phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </Card>

        <Button
          title={updateSecretary.isPending ? t('doctors.saving') : t('doctors.save')}
          loading={updateSecretary.isPending}
          onPress={handleSubmit((data) =>
            updateSecretary.mutate(
              {
                id: secretary.userId || secretary.id,
                payload: {
                  firstName: data.firstName.trim(),
                  lastName: data.lastName.trim(),
                  phone: data.phone.trim(),
                },
              },
              { onSuccess: () => router.back() },
            ),
          )}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
