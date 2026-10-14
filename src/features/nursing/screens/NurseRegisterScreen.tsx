import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useRegisterNurseMutation } from '@/features/auth/hooks/useAuthMutations';
import { nurseRegisterSchema, type NurseRegisterForm } from '@/features/nursing/schemas/nursing.schemas';
import { useGuestGuard } from '@/shared/navigation/guards';
import { Logo } from '@/shared/components/brand/Logo';
import { FormInput } from '@/shared/components/form/FormInput';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function NurseRegisterScreen() {
  useGuestGuard();
  const { t } = useTranslation('nursing');
  const { t: ta } = useTranslation('auth');
  const registerNurse = useRegisterNurseMutation();
  const { control, handleSubmit } = useForm<NurseRegisterForm>({
    resolver: zodResolver(nurseRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      proof: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <Screen scroll>
      <Header showBack />
      <View className="gap-4 pb-8">
        <View className="mb-2 items-center">
          <Logo size="md" className="mb-4" />
          <Text variant="titleLg" className="mb-2 text-center">
            {t('registerTitle')}
          </Text>
          <Text variant="body" muted className="text-center">
            {t('registerSubtitle')}
          </Text>
        </View>
        <Card className="gap-4">
          <FormInput control={control} name="firstName" label={ta('register.firstName')} />
          <FormInput control={control} name="lastName" label={ta('register.lastName')} />
          <FormInput
            control={control}
            name="email"
            label={ta('register.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <FormInput control={control} name="phone" label={ta('register.phone')} keyboardType="phone-pad" />
          <FormInput control={control} name="proof" label={t('proof')} />
          <FormInput control={control} name="password" label={ta('register.password')} secureTextEntry />
          <FormInput
            control={control}
            name="confirmPassword"
            label={ta('register.confirmPassword')}
            secureTextEntry
          />
        </Card>
        <Button
          title={t('registerAction')}
          onPress={handleSubmit((data) =>
            registerNurse.mutate({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              password: data.password,
              proof: data.proof,
            }),
          )}
          loading={registerNurse.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
