import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { shareStaffAccessOnWhatsApp } from '@/features/admin/lib/shareStaffAccess';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function StaffAccessSentCard({
  message,
  phone,
  username,
  password,
  onDone,
}: {
  message: string;
  phone: string;
  username: string;
  password: string;
  onDone: () => void;
}) {
  const { t } = useTranslation('admin');

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('staffAccess.readyTitle')}</Text>
      <Text variant="bodySm" muted>
        {t('staffAccess.shareHint')}
      </Text>
      <View className="gap-1">
        <Text variant="caption" muted>
          {t('staffAccess.username')}
        </Text>
        <Text variant="label">{username}</Text>
      </View>
      <View className="gap-1">
        <Text variant="caption" muted>
          {t('doctors.password')}
        </Text>
        <Text variant="label">{password}</Text>
      </View>
      <Text variant="bodySm" style={{ alignSelf: 'stretch' }}>
        {message}
      </Text>
      <Button
        title={t('staffAccess.shareWhatsApp')}
        fullWidth
        onPress={async () => {
          try {
            await shareStaffAccessOnWhatsApp(phone, message);
          } catch {
            Toast.show({ type: 'error', text1: t('staffAccess.shareFailed') });
          }
        }}
      />
      <Button title={t('staffAccess.done')} variant="outline" fullWidth onPress={onDone} />
    </Card>
  );
}
