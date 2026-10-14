import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCallNextMutation, useQueueQuery } from '@/features/billing/hooks/useBillingQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';

function personName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function WaitingRoomScreen() {
  const { t } = useTranslation('appointments');
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const queueQuery = useQueueQuery(clinicId ?? undefined);
  const callNext = useCallNextMutation();
  const room = queueQuery.data ?? [];
  const serving = room.find((item) => item.queue === 'serving');
  const waiting = room.filter((item) => item.queue === 'waiting');

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('queue.screenTitle')} />
      <View className="gap-4 pb-10">
        <Text variant="bodySm" muted>
          {t('queue.screenHint')}
        </Text>
        <Card className="items-center gap-2 py-8">
          <Text variant="label">{t('queue.nowServing')}</Text>
          <Text variant="titleLg" className="text-center">
            {serving ? personName(serving.patient.firstName, serving.patient.lastName) : t('queue.emptyNow')}
          </Text>
        </Card>
        <Card className="gap-3">
          <Text variant="titleSm">{t('queue.next')}</Text>
          {waiting.length ? (
            waiting.map((item, index) => (
              <Text key={item.id} variant="body">
                {index + 1}. {personName(item.patient.firstName, item.patient.lastName)}
              </Text>
            ))
          ) : (
            <Text variant="bodySm" muted>
              {t('queue.emptyNext')}
            </Text>
          )}
        </Card>
        <Button
          title={t('queue.callNext')}
          fullWidth
          size="lg"
          loading={callNext.isPending}
          disabled={!clinicId || (!serving && waiting.length === 0)}
          onPress={() => clinicId && callNext.mutate(clinicId)}
        />
      </View>
    </Screen>
  );
}
