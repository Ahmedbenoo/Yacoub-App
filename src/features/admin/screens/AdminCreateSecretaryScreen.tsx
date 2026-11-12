import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { StaffAccessSentCard } from '@/features/admin/components/StaffAccessSentCard';
import { useCreateSecretaryMutation } from '@/features/admin/hooks';
import { createSecretarySchema } from '@/features/admin/schemas/admin.schemas';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { buildStaffWelcomeMessage } from '@/shared/lib/staff-welcome';
import { useActiveClinicQuery } from '@/features/clinic/hooks';

type CreateSecretaryForm = z.infer<typeof createSecretarySchema>;

export function AdminCreateSecretaryScreen() {
  const { t } = useTranslation('admin');
  const createSecretary = useCreateSecretaryMutation();
  const { data: clinic } = useActiveClinicQuery();
  const [access, setAccess] = useState<{
    message: string;
    phone: string;
    username: string;
    password: string;
  } | null>(null);
  const { control, handleSubmit } = useForm<CreateSecretaryForm>({
    resolver: zodResolver(createSecretarySchema),
    defaultValues: { firstName: '', lastName: '', phone: '', password: '' },
  });

  if (access) {
    return (
      <Screen scroll className="px-5">
        <Header showBack title={t('secretary.createTitle')} />
        <View className="py-4">
          <StaffAccessSentCard
            message={access.message}
            phone={access.phone}
            username={access.username}
            password={access.password}
            onDone={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('secretary.createTitle')} />

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
        </Card>

        <Button
          title={createSecretary.isPending ? t('secretary.creating') : t('secretary.createAction')}
          onPress={handleSubmit((data) =>
            createSecretary.mutate(
              {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                phone: data.phone.trim(),
                password: data.password.trim(),
              },
              {
                onSuccess: (account) => {
                  if (account.linkedExisting) {
                    router.back();
                    return;
                  }
                  const phone = data.phone.trim();
                  const password = data.password.trim();
                  setAccess({
                    phone,
                    username: formatPhoneForDisplay(phone),
                    password,
                    message:
                      account.credentialsWhatsApp ||
                      buildStaffWelcomeMessage({
                        role: 'secretary',
                        personName: `${data.firstName} ${data.lastName}`.trim(),
                        clinicName: clinic?.nameAr || clinic?.name || 'العيادة',
                        phone,
                        password,
                      }),
                  });
                },
              },
            ),
          )}
          loading={createSecretary.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
