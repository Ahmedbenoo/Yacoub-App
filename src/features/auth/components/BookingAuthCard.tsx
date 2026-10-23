import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePhoneAuthMutation } from '@/features/auth/hooks';
import { bookingAuthSchema, type BookingAuthFormData } from '@/features/auth/schemas/auth.schemas';
import { normalizeApiError } from '@/shared/api/client';
import { FormInput } from '@/shared/components/form/FormInput';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { UserRole } from '@/shared/types/enums';

interface BookingAuthCardProps {
  clinicId?: string;
  onAuthenticated?: () => void;
}

export function BookingAuthCard({ clinicId, onAuthenticated }: BookingAuthCardProps) {
  const { t } = useTranslation('auth');
  const phoneAuth = usePhoneAuthMutation();
  const form = useForm<BookingAuthFormData>({
    resolver: zodResolver(bookingAuthSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', password: '', clinicId },
  });

  const askForName = (data: BookingAuthFormData) => {
    const firstName = data.firstName?.trim() ?? '';
    const lastName = data.lastName?.trim() ?? '';
    if (firstName.length >= 2 && lastName.length >= 2) return false;
    if (firstName.length < 2) form.setError('firstName', { message: 'firstNameMin' });
    if (lastName.length < 2) form.setError('lastName', { message: 'lastNameMin' });
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
        control={form.control}
        name="firstName"
        label={t('register.firstName')}
        placeholder={t('register.firstNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
      />
      <FormInput
        control={form.control}
        name="lastName"
        label={t('register.lastName')}
        placeholder={t('register.lastNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
      />
      <FormInput
        control={form.control}
        name="phone"
        label={t('bookingAuth.phone')}
        placeholder={t('bookingAuth.phonePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <FormInput
        control={form.control}
        name="password"
        label={t('bookingAuth.password')}
        placeholder={t('bookingAuth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="password"
      />

      <Button
        title={t('bookingAuth.submit')}
        onPress={form.handleSubmit((data) =>
          phoneAuth.mutate(
            { ...data, clinicId },
            {
              onSuccess: (session) => {
                const isPatient = session.user.roles.includes(UserRole.PATIENT) && session.user.roles.length === 1;
                if (isPatient) onAuthenticated?.();
              },
              onError: (error) => {
                if (normalizeApiError(error).code !== 'NAME_REQUIRED') return;
                askForName(data);
              },
            },
          ),
        )}
        loading={phoneAuth.isPending}
        fullWidth
        size="lg"
      />
    </Card>
  );
}
