import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useGuestGuard } from '@/shared/navigation/guards';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { Input } from '@/shared/components/ui/Input';
import { Logo } from '@/shared/components/brand/Logo';
import { useSpecialtyOptions } from '@/features/admin/hooks';
import { FormSelect } from '@/shared/components/form/FormSelect';
import {
  registerDoctorSchema,
  registerSchema,
  type RegisterDoctorFormData,
  type RegisterFormData,
} from '@/features/auth/schemas/auth.schemas';
import { useRegisterDoctorMutation, useRegisterMutation } from '@/features/auth/hooks/useAuthMutations';

type AccountKind = 'doctor' | 'clinic' | 'center' | 'patient' | 'nurse';
type RegisterStep = 'choose' | 'doctor' | 'patient';

const ACCOUNT_KINDS: { kind: AccountKind; icon: string }[] = [
  { kind: 'doctor', icon: '🩺' },
  { kind: 'clinic', icon: '🏥' },
  { kind: 'center', icon: '🏢' },
  { kind: 'patient', icon: '👤' },
  { kind: 'nurse', icon: '💉' },
];

export function RegisterScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const [step, setStep] = useState<RegisterStep>('choose');
  const [patientPhase, setPatientPhase] = useState<'details' | 'otp'>('details');

  const handleBack = () => {
    if (step === 'patient' && patientPhase === 'otp') {
      setPatientPhase('details');
      return;
    }
    if (step !== 'choose') {
      setStep('choose');
      setPatientPhase('details');
      return;
    }
    if (router.canGoBack()) router.back();
  };

  const handleKind = (kind: AccountKind) => {
    if (kind === 'clinic' || kind === 'center') {
      router.push(`/(auth)/register-clinic?kind=${kind}` as never);
      return;
    }
    if (kind === 'nurse') {
      router.push('/(auth)/register-nurse');
      return;
    }
    if (kind === 'doctor') {
      setStep('doctor');
      return;
    }
    setPatientPhase('details');
    setStep('patient');
  };

  const title =
    step === 'doctor' ? t('register.doctorTitle') : t('register.title');
  const subtitle =
    step === 'doctor'
      ? t('register.doctorSubtitle')
      : step === 'patient'
        ? t('register.subtitle')
        : t('register.chooseSubtitle');

  return (
    <Screen scroll>
      <Header showBack onBack={handleBack} />
      <View className="pb-8">
        <View className="mb-8 items-center">
          <Logo size="md" className="mb-4" />
          <Text variant="titleLg" className="mb-2 text-center">
            {title}
          </Text>
          <Text variant="body" muted className="text-center">
            {subtitle}
          </Text>
        </View>

        {step === 'choose' ? <AccountTypeList onSelect={handleKind} /> : null}
        {step === 'doctor' ? <DoctorRegisterForm /> : null}
        {step === 'patient' ? (
          <PatientRegisterForm phase={patientPhase} onPhaseChange={setPatientPhase} />
        ) : null}

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text variant="bodySm" muted>
            {t('register.hasAccount')}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text variant="label" className="text-primary-600 dark:text-primary-400">
              {t('register.signIn')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function AccountTypeList({ onSelect }: { onSelect: (kind: AccountKind) => void }) {
  const { t } = useTranslation('auth');

  return (
    <View className="gap-3">
      {ACCOUNT_KINDS.map((option) => (
        <Card key={option.kind} className="p-0">
          <Pressable
            onPress={() => onSelect(option.kind)}
            className="flex-row items-center gap-4 p-4 active:opacity-80"
          >
            <Text variant="titleLg">{option.icon}</Text>
            <View className="flex-1">
              <Text variant="titleSm">{t(`register.kinds.${option.kind}`)}</Text>
              <Text variant="bodySm" muted>
                {t(`register.kinds.${option.kind}Description`)}
              </Text>
            </View>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

function DoctorRegisterForm() {
  const { t } = useTranslation('auth');
  const registerDoctor = useRegisterDoctorMutation();
  const specialtyOptions = useSpecialtyOptions();
  const { control, handleSubmit } = useForm<RegisterDoctorFormData>({
    resolver: zodResolver(registerDoctorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'male',
      password: '',
      confirmPassword: '',
      specialty: '',
    },
  });

  return (
    <View className="gap-4">
      <FormInput control={control} name="firstName" label={t('register.firstName')} autoCapitalize="words" />
      <FormInput control={control} name="lastName" label={t('register.lastName')} autoCapitalize="words" />
      <FormInput
        control={control}
        name="email"
        label={t('register.email')}
        placeholder={t('register.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormInput control={control} name="phone" label={t('register.phone')} keyboardType="phone-pad" />
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
      <FormSelect
        control={control}
        name="specialty"
        label={t('owner.specialty')}
        placeholder={t('owner.specialtyPlaceholder')}
        options={specialtyOptions}
        searchable
      />
      <FormInput control={control} name="password" label={t('register.password')} secureTextEntry />
      <FormInput control={control} name="confirmPassword" label={t('register.confirmPassword')} secureTextEntry />
      <Button
        title={t('register.doctorSubmit')}
        onPress={handleSubmit((data) =>
          registerDoctor.mutate({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim(),
            phone: data.phone.trim(),
            gender: data.gender,
            password: data.password,
            specialty: data.specialty,
          }),
        )}
        loading={registerDoctor.isPending}
        fullWidth
        size="lg"
      />
    </View>
  );
}

function PatientRegisterForm({
  phase,
  onPhaseChange,
}: {
  phase: 'details' | 'otp';
  onPhaseChange: (phase: 'details' | 'otp') => void;
}) {
  const { t } = useTranslation('auth');
  const registerMutation = useRegisterMutation();
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState<RegisterFormData | null>(null);

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (phase === 'otp' && pending) {
    return (
      <View className="gap-4">
        <Text variant="body" muted className="text-center">
          {t('register.otpHint')}
        </Text>
        <Input
          label={t('register.otp')}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          title={t('register.verify')}
          onPress={() => {
            if (otp.trim() !== '123456') {
              Toast.show({ type: 'error', text1: t('register.otpInvalid') });
              return;
            }
            registerMutation.mutate(pending);
          }}
          loading={registerMutation.isPending}
          fullWidth
          size="lg"
        />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <FormInput
        control={control}
        name="firstName"
        label={t('register.firstName')}
        placeholder={t('register.firstNamePlaceholder')}
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="lastName"
        label={t('register.lastName')}
        placeholder={t('register.lastNamePlaceholder')}
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="phone"
        label={t('register.phone')}
        placeholder={t('register.phonePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <FormInput
        control={control}
        name="password"
        label={t('register.password')}
        placeholder={t('register.passwordPlaceholder')}
        secureTextEntry
      />
      <FormInput
        control={control}
        name="confirmPassword"
        label={t('register.confirmPassword')}
        placeholder={t('register.confirmPasswordPlaceholder')}
        secureTextEntry
      />

      <Button
        title={t('register.continue')}
        onPress={handleSubmit((data) => {
          setPending(data);
          onPhaseChange('otp');
        })}
        fullWidth
        size="lg"
      />
    </View>
  );
}

