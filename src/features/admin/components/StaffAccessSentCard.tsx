import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function StaffAccessSentCard({ message, onDone }: { message: string; onDone: () => void }) {
  const { t } = useTranslation('admin');

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('staffAccess.sentTitle')}</Text>
      <Text variant="bodySm" style={{ alignSelf: 'stretch' }}>
        {message}
      </Text>
      <View>
        <Button title={t('staffAccess.done')} fullWidth onPress={onDone} />
      </View>
    </Card>
  );
}
