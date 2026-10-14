import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useGuestGuard } from '@/shared/navigation/guards';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { verifyOtpSchema, type VerifyOtpFormData } from '@/features/auth/schemas/auth.schemas';
import { useAuthFlowStore } from '@/features/auth/store/auth-flow.store';
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/features/auth/hooks/useAuthMutations';

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyOtpScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();
  const resetEmail = useAuthFlowStore((s) => s.resetEmail);
  const [seconds, setSeconds] = useState(RESEND_COOLDOWN_SECONDS);

  const { control, handleSubmit, setValue } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: resetEmail ?? '', otp: '' },
  });

  useEffect(() => {
    if (resetEmail) {
      setValue('email', resetEmail);
    }
  }, [resetEmail, setValue]);

  useEffect(() => {
    if (!resetEmail) {
      router.replace('/(auth)/forgot-password');
    }
  }, [resetEmail]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = () => {
    if (!resetEmail || seconds > 0 || resendMutation.isPending) return;
    resendMutation.mutate(resetEmail, {
      onSuccess: () => setSeconds(RESEND_COOLDOWN_SECONDS),
    });
  };

  const onSubmit = (data: VerifyOtpFormData) => {
    verifyMutation.mutate({
      email: resetEmail ?? data.email,
      otp: data.otp,
    });
  };

  if (!resetEmail) {
    return null;
  }

  return (
    <Screen scroll>
      <Header showBack />
      <View className="flex-1 justify-center pb-8">
        <View className="mb-8">
          <Text variant="titleLg" className="mb-2">
            {t('verifyOtp.title')}
          </Text>
          <Text variant="body" muted>
            {t('verifyOtp.subtitle')}
          </Text>
          <Text variant="bodySm" className="mt-2 text-primary-600 dark:text-primary-400">
            {resetEmail}
          </Text>
        </View>

        <View className="gap-4">
          <FormInput
            control={control}
            name="otp"
            label={t('verifyOtp.otp')}
            placeholder={t('verifyOtp.otpPlaceholder')}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <Button
            title={t('verifyOtp.verify')}
            onPress={handleSubmit(onSubmit)}
            loading={verifyMutation.isPending}
            fullWidth
            size="lg"
          />

          {seconds > 0 ? (
            <Text variant="caption" muted className="text-center">
              {t('verifyOtp.resendIn', { seconds })}
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={resendMutation.isPending}>
              <Text
                variant="label"
                className="text-center text-primary-600 dark:text-primary-400"
              >
                {resendMutation.isPending ? t('verifyOtp.resending') : t('verifyOtp.resend')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}
