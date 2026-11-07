import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function GuestAccountCard() {
  const { t } = useTranslation('patient');

  return (
    <Card elevated className="gap-2 p-3">
      <Text variant="titleSm">{t('guest.accountTitle')}</Text>
      <Text variant="bodySm" muted>
        {t('guest.accountDescription')}
      </Text>
      <Button
        title={t('guest.createAccount')}
        onPress={() => router.push('/(auth)/register')}
        fullWidth
        className="h-11 min-h-0"
      />
      <Button
        title={t('guest.signIn')}
        variant="ghost"
        onPress={() => router.push('/(auth)/login')}
        fullWidth
        className="h-9 min-h-0"
      />
    </Card>
  );
}
