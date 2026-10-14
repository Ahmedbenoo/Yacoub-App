import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppointmentWhatsAppQuery } from '@/features/whatsapp/hooks/useWhatsAppQueries';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function AppointmentWhatsAppCard({ appointmentId }: { appointmentId: string }) {
  const { t } = useTranslation('appointments');
  const { data } = useAppointmentWhatsAppQuery(appointmentId);
  const messages = data ?? [];

  if (!messages.length) return null;

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('whatsapp.title')}</Text>
      <Text variant="caption" muted>
        {t('whatsapp.hint')}
      </Text>
      {messages.map((message) => (
        <View key={message.id} className="gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Text variant="label">{t(`whatsapp.kinds.${message.kind}`)}</Text>
          <Text variant="bodySm">{message.body}</Text>
          <Text variant="caption" muted>
            {message.status === 'sent' ? t('whatsapp.sent') : t('whatsapp.scheduled')}
          </Text>
        </View>
      ))}
    </Card>
  );
}
