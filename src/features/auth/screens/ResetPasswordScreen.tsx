import { useEffect } from 'react';
import { View } from 'react-native';
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
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/features/auth/schemas/auth.schemas';
import { useAuthFlowStore } from '@/features/auth/store/auth-flow.store';
import { useResetPasswordMutation } from '@/features/auth/hooks/useAuthMutations';

export function ResetPasswordScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const mutation = useResetPasswordMutation();
  const resetEmail = useAuthFlowStore((s) => s.resetEmail);
  const resetToken = useAuthFlowStore((s) => s.resetToken);

  const { control, handleSubmit, setValue } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phone: resetEmail ?? '',
      resetToken: resetToken ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (resetEmail) setValue('phone', resetEmail);
    if (resetToken) setValue('resetToken', resetToken);
  }, [resetEmail, resetToken, setValue]);

  useEffect(() => {
    if (!resetEmail || !resetToken) {
      router.replace('/(auth)/forgot-password');
    }
  }, [resetEmail, resetToken]);

  if (!resetEmail || !resetToken) {
    return null;
  }

  return (
    <Screen scroll>
      <Header showBack />
      <View className="flex-1 justify-center pb-8">
        <View className="mb-8">
          <Text variant="titleLg" className="mb-2">
            {t('resetPassword.title')}
          </Text>
          <Text variant="body" muted>
            {t('resetPassword.subtitle')}
          </Text>
        </View>

        <View className="gap-4">
          <FormInput
            control={control}
            name="password"
            label={t('resetPassword.password')}
            placeholder={t('resetPassword.passwordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="confirmPassword"
            label={t('resetPassword.confirmPassword')}
            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
            secureTextEntry
          />
          <Button
            title={t('resetPassword.reset')}
            onPress={handleSubmit((data) =>
              mutation.mutate({
                phone: resetEmail,
                resetToken,
                password: data.password,
                confirmPassword: data.confirmPassword,
              }),
            )}
            loading={mutation.isPending}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </Screen>
  );
}
