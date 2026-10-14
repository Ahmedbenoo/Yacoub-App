import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useChangePasswordMutation } from '@/features/auth/hooks/useAuthMutations';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/features/auth/schemas/auth.schemas';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';

export function ChangePasswordScreen() {
  const { t } = useTranslation('auth');
  const changePassword = useChangePasswordMutation();

  const { control, handleSubmit, reset } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        reset();
        router.back();
      },
    });
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('changePassword.title')} />

      <View className="gap-4 py-4">
        <Text variant="body" muted>
          {t('changePassword.subtitle')}
        </Text>

        <Card className="gap-4">
          <FormInput
            control={control}
            name="currentPassword"
            label={t('changePassword.currentPassword')}
            placeholder={t('changePassword.currentPasswordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="password"
            label={t('changePassword.newPassword')}
            placeholder={t('changePassword.newPasswordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="confirmPassword"
            label={t('changePassword.confirmPassword')}
            placeholder={t('changePassword.confirmPasswordPlaceholder')}
            secureTextEntry
          />
        </Card>

        <Button
          title={changePassword.isPending ? t('changePassword.saving') : t('changePassword.save')}
          onPress={handleSubmit(onSubmit)}
          loading={changePassword.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
