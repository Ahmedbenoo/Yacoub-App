import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRegisterOwnerMutation } from '@/features/auth/hooks/useAuthMutations';
import {
  registerOwnerSchema,
  type RegisterOwnerFormData,
} from '@/features/auth/schemas/auth.schemas';
import { Logo } from '@/shared/components/brand/Logo';
import { FormInput } from '@/shared/components/form/FormInput';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { phoneToStaffEmail } from '@/shared/lib/phone';
import { useGuestGuard } from '@/shared/navigation/guards';

export function RegisterClinicScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const registerOwner = useRegisterOwnerMutation();
  const params = useLocalSearchParams<{ kind?: string | string[] }>();
  const kindParam = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const lockedKind = kindParam === 'center' || kindParam === 'clinic' ? kindParam : null;

  const { control, handleSubmit, watch, setValue } = useForm<RegisterOwnerFormData>({
    resolver: zodResolver(registerOwnerSchema),
    defaultValues: {
      placeKind: lockedKind ?? 'clinic',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      placeName: '',
      practices: false,
    },
  });

  const placeKind = watch('placeKind');
  const practices = watch('practices');

  useEffect(() => {
    if (lockedKind) setValue('placeKind', lockedKind);
  }, [lockedKind, setValue]);

  const title =
    lockedKind === 'center'
      ? t('owner.centerTitle')
      : lockedKind === 'clinic'
        ? t('owner.clinicTitle')
        : t('owner.title');

  return (
    <Screen scroll>
      <Header showBack />
      <View className="gap-4 pb-8">
        <View className="mb-2 items-center">
          <Logo size="md" className="mb-4" />
          <Text variant="titleLg" className="mb-2 text-center">
            {title}
          </Text>
          <Text variant="body" muted className="text-center">
            {t('owner.subtitle')}
          </Text>
        </View>

        {lockedKind ? null : (
          <Card className="gap-3">
            <Text variant="label">{t('owner.placeKind')}</Text>
            <SegmentedControl
              options={[
                { value: 'clinic', label: t('owner.singleClinic') },
                { value: 'center', label: t('owner.center') },
              ]}
              value={placeKind}
              onChange={(value) => setValue('placeKind', value)}
            />
          </Card>
        )}

        <Card className="gap-4">
          <FormInput control={control} name="firstName" label={t('register.firstName')} />
          <FormInput control={control} name="lastName" label={t('register.lastName')} />
          <FormInput
            control={control}
            name="phone"
            label={t('register.phone')}
            keyboardType="phone-pad"
          />
          <FormInput control={control} name="password" label={t('register.password')} secureTextEntry />
          <FormInput
            control={control}
            name="confirmPassword"
            label={t('register.confirmPassword')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="placeName"
            label={placeKind === 'center' ? t('owner.centerName') : t('owner.clinicName')}
          />
        </Card>

        <Card className="gap-3">
          <Text variant="label">{t('owner.practices')}</Text>
          <SegmentedControl
            options={[
              { value: 'doctor', label: t('owner.practicesYes') },
              { value: 'owner', label: t('owner.practicesNo') },
            ]}
            value={practices ? 'doctor' : 'owner'}
            onChange={(value) => setValue('practices', value === 'doctor')}
          />
        </Card>

        <Button
          title={placeKind === 'center' ? t('owner.submitCenter') : t('owner.submit')}
          onPress={handleSubmit((data) =>
            registerOwner.mutate({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: phoneToStaffEmail(data.phone, 'owner'),
              phone: data.phone.trim(),
              gender: 'male',
              password: data.password,
              placeKind: data.placeKind,
              placeName: data.placeName.trim(),
              clinicPhone: data.phone.trim(),
              practices: data.practices,
              street: '  ',
              city: '  ',
              specialty: '  ',
              openingHours: '  ',
              consultationFee: 0,
            }),
          )}
          loading={registerOwner.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
