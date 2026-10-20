import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { SubscriptionPlansCard } from '@/features/billing/components/SubscriptionPlansCard';
import { useRegisterOwnerMutation } from '@/features/auth/hooks/useAuthMutations';
import {
  registerOwnerSchema,
  type RegisterOwnerFormData,
} from '@/features/auth/schemas/auth.schemas';
import { formatOpeningHours, OpeningHoursCalendar } from '@/features/admin/components/OpeningHoursCalendar';
import { useSpecialtyOptions } from '@/features/admin/hooks';
import { Logo } from '@/shared/components/brand/Logo';
import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { useGuestGuard } from '@/shared/navigation/guards';

export function RegisterClinicScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const registerOwner = useRegisterOwnerMutation();
  const specialtyOptions = useSpecialtyOptions();
  const params = useLocalSearchParams<{ kind?: string | string[] }>();
  const kindParam = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const lockedKind = kindParam === 'center' || kindParam === 'clinic' ? kindParam : null;

  const { control, handleSubmit, watch, setValue } = useForm<RegisterOwnerFormData>({
    resolver: zodResolver(registerOwnerSchema),
    defaultValues: {
      placeKind: lockedKind ?? 'clinic',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'male',
      password: '',
      confirmPassword: '',
      placeName: '',
      clinicName: '',
      clinicPhone: '',
      street: '',
      city: '',
      locationUrl: '',
      specialty: '',
      openingHours: formatOpeningHours([6, 0, 1, 2, 3, 4], '10:00', '22:00'),
      consultationFee: '',
      practices: 'no',
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

        <SubscriptionPlansCard onlyId={placeKind === 'center' ? 'center' : 'clinic'} />

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
            name="email"
            label={t('register.email')}
            placeholder={t('register.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            control={control}
            name="phone"
            label={t('register.phone')}
            keyboardType="phone-pad"
          />
          <Text variant="label">{t('register.gender')}</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <SegmentedControl
                options={[
                  { value: 'male', label: t('register.genderMale') },
                  { value: 'female', label: t('register.genderFemale') },
                ]}
                value={value}
                onChange={onChange}
              />
            )}
          />
          <FormInput control={control} name="password" label={t('register.password')} secureTextEntry />
          <FormInput
            control={control}
            name="confirmPassword"
            label={t('register.confirmPassword')}
            secureTextEntry
          />
        </Card>

        <Card className="gap-4">
          <FormInput
            control={control}
            name="placeName"
            label={placeKind === 'center' ? t('owner.centerName') : t('owner.clinicName')}
          />
          {placeKind === 'center' ? (
            <FormInput control={control} name="clinicName" label={t('owner.firstClinicName')} />
          ) : null}
          <FormSelect
            control={control}
            name="specialty"
            label={t('owner.specialty')}
            placeholder={t('owner.specialtyPlaceholder')}
            options={specialtyOptions}
            searchable
          />
          <FormInput
            control={control}
            name="clinicPhone"
            label={t('owner.clinicPhone')}
            keyboardType="phone-pad"
          />
          <FormInput control={control} name="city" label={t('owner.city')} />
          <FormInput control={control} name="street" label={t('owner.street')} />
          <FormInput
            control={control}
            name="locationUrl"
            label={t('owner.locationUrl')}
            autoCapitalize="none"
          />
          <Controller
            control={control}
            name="openingHours"
            render={({ field: { value, onChange } }) => (
              <OpeningHoursCalendar value={value} onChange={onChange} />
            )}
          />
          <FormInput
            control={control}
            name="consultationFee"
            label={t('owner.consultationFee')}
            placeholder={t('owner.consultationFeePlaceholder')}
            keyboardType="number-pad"
          />
        </Card>

        <Card className="gap-3">
          <Text variant="label">{t('owner.practices')}</Text>
          <SegmentedControl
            options={[
              { value: 'no', label: t('owner.practicesNo') },
              { value: 'yes', label: t('owner.practicesYes') },
            ]}
            value={practices}
            onChange={(value) => setValue('practices', value)}
          />
        </Card>

        <Button
          title={placeKind === 'center' ? t('owner.submitCenter') : t('owner.submit')}
          onPress={handleSubmit((data) =>
            registerOwner.mutate({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email.trim(),
              phone: data.phone.trim(),
              gender: data.gender,
              password: data.password,
              placeKind: data.placeKind,
              placeName: data.placeName.trim(),
              clinicName: data.clinicName?.trim(),
              clinicPhone: data.clinicPhone.trim(),
              street: data.street.trim(),
              city: data.city.trim(),
              locationUrl: data.locationUrl?.trim() || undefined,
              specialty: data.specialty,
              openingHours: data.openingHours.trim(),
              consultationFee: Number(data.consultationFee),
              practices: data.practices === 'yes',
            }),
          )}
          loading={registerOwner.isPending}
          fullWidth
          size="lg"
        />

        <Pressable onPress={() => router.push('/(auth)/login')} className="items-center">
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {t('register.signIn')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
