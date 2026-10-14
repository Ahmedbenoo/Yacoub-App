import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useBookingAuthMutation } from '@/features/auth/hooks';
import { bookingAuthSchema, type BookingAuthFormData } from '@/features/auth/schemas/auth.schemas';
import { normalizeApiError } from '@/shared/api/client';
import { FormInput } from '@/shared/components/form/FormInput';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

interface BookingAuthCardProps {
  onAuthenticated?: () => void;
}

export function BookingAuthCard({ onAuthenticated }: BookingAuthCardProps) {
  const { t } = useTranslation('auth');
  const mutation = useBookingAuthMutation();

  const { control, handleSubmit, setError } = useForm<BookingAuthFormData>({
    resolver: zodResolver(bookingAuthSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', password: '' },
  });

  const askForName = (data: BookingAuthFormData) => {
    const firstName = data.firstName?.trim() ?? '';
    const lastName = data.lastName?.trim() ?? '';
    if (firstName.length >= 2 && lastName.length >= 2) return false;
    if (firstName.length < 2) setError('firstName', { message: 'firstNameMin' });
    if (lastName.length < 2) setError('lastName', { message: 'lastNameMin' });
    return true;
  };

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text variant="titleSm">{t('bookingAuth.title')}</Text>
        <Text variant="bodySm" muted>
          {t('bookingAuth.subtitle')}
        </Text>
      </View>

      <FormInput
        control={control}
        name="firstName"
        label={t('register.firstName')}
        placeholder={t('register.firstNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
      />
      <FormInput
        control={control}
        name="lastName"
        label={t('register.lastName')}
        placeholder={t('register.lastNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
      />
      <FormInput
        control={control}
        name="phone"
        label={t('bookingAuth.phone')}
        placeholder={t('bookingAuth.phonePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <FormInput
        control={control}
        name="password"
        label={t('bookingAuth.password')}
        placeholder={t('bookingAuth.passwordPlaceholder')}
        secureTextEntry
      />

      <Button
        title={t('bookingAuth.submit')}
        onPress={handleSubmit((data) =>
          mutation.mutate(data, {
            onSuccess: () => onAuthenticated?.(),
            onError: (error) => {
              if (normalizeApiError(error).code !== 'NAME_REQUIRED') return;
              askForName(data);
            },
          }),
        )}
        loading={mutation.isPending}
        fullWidth
        size="lg"
      />
    </Card>
  );
}
