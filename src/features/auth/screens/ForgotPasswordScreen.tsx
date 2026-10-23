import { View } from 'react-native';
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
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/features/auth/schemas/auth.schemas';
import { useForgotPasswordMutation } from '@/features/auth/hooks/useAuthMutations';

export function ForgotPasswordScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const mutation = useForgotPasswordMutation();

  const { control, handleSubmit } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: '' },
  });

  return (
    <Screen scroll>
      <Header showBack />
      <View className="flex-1 justify-center pb-8">
        <View className="mb-8">
          <Text variant="titleLg" className="mb-2">
            {t('forgotPassword.title')}
          </Text>
          <Text variant="body" muted>
            {t('forgotPassword.subtitle')}
          </Text>
        </View>

        <View className="gap-4">
          <FormInput
            control={control}
            name="phone"
            label={t('forgotPassword.phone')}
            placeholder={t('forgotPassword.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Button
            title={t('forgotPassword.sendCode')}
            onPress={handleSubmit((data) => mutation.mutate(data))}
            loading={mutation.isPending}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </Screen>
  );
}
