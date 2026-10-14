import { useTranslation } from 'react-i18next';

import { useQueueQuery } from '@/features/billing/hooks/useBillingQueries';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import type { Appointment } from '@/shared/types/models/appointment';

export function QueuePositionCard({ appointment }: { appointment: Appointment }) {
  const { t } = useTranslation('appointments');
  const queueQuery = useQueueQuery(appointment.queue ? appointment.clinicId : undefined);
  if (!appointment.queue || appointment.queue === 'done') return null;

  const waiting = (queueQuery.data ?? []).filter((item) => item.queue === 'waiting');
  const ahead = waiting.filter((item) => (item.queueNumber ?? 0) < (appointment.queueNumber ?? 0)).length;

  return (
    <Card className="items-center gap-1">
      <Text variant="label">{t('queue.yourTurn')}</Text>
      <Text variant="titleLg">
        {appointment.queue === 'serving' ? t('queue.now') : t('queue.position', { count: ahead + 1 })}
      </Text>
    </Card>
  );
}
