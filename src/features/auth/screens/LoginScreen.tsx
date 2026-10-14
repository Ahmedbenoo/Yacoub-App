import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useLoginMutation } from '@/features/auth/hooks/useAuthMutations';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schemas';
import { Logo } from '@/shared/components/brand/Logo';
import { FormInput } from '@/shared/components/form/FormInput';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useGuestGuard } from '@/shared/navigation/guards';

export function LoginScreen() {
  useGuestGuard();
  const { t } = useTranslation('auth');
  const loginMutation = useLoginMutation();
  const { alignInlineEnd } = useLayoutDirection();

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-8">
        <View className="mb-10 items-center">
          <Logo size="lg" className="mb-6" />
          <Text variant="titleLg" className="mb-2 text-center">
            {t('login.title')}
          </Text>
          <Text variant="body" muted className="text-center">
            {t('login.subtitle')}
          </Text>
        </View>

        <View className="gap-4">
          <FormInput
            control={control}
            name="identifier"
            label={t('login.identifier')}
            placeholder={t('login.identifierPlaceholder')}
            autoCapitalize="none"
            autoComplete="tel" 
          />
          <FormInput
            control={control}
            name="password"
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
            secureTextEntry
            autoComplete="password"
          />

          <Pressable
            style={alignInlineEnd}
            className="py-1"
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text variant="label" className="text-primary-600 dark:text-primary-400">
              {t('login.forgotPassword')}
            </Text>
          </Pressable>

          <Button
            title={t('login.signIn')}
            testID="login-submit"
            onPress={handleSubmit((data) => loginMutation.mutate(data))}
            loading={loginMutation.isPending}
            fullWidth
            size="lg"
          />

          {/* {env.useMockApi && (
            <Text variant="caption" muted className="text-center">
              {t('login.demoHint')}
            </Text>
          )} */}
        </View>

        <Pressable
          className="mt-6 items-center"
          onPress={() => router.replace('/(patient)/(tabs)/home' as never)}
        >
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {t('login.browseAsGuest')}
          </Text>
        </Pressable>

        <Row className="mt-8 items-center justify-center gap-1">
          <Text variant="bodySm" muted>
            {t('login.noAccount')}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text variant="label" className="text-primary-600 dark:text-primary-400">
              {t('login.signUp')}
            </Text>
          </Pressable>
        </Row>
      </View>
    </Screen>
  );
}
