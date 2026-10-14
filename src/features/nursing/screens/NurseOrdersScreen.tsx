import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NursingOrderCard } from '@/features/nursing/components/NursingOrderCard';
import {
  useNurseNursingRequestsQuery,
  useNurseProfileQuery,
} from '@/features/nursing/hooks/useNursingQueries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import { NurseVerification } from '@/shared/types/enums';

export function NurseOrdersScreen() {
  const { t } = useTranslation('nursing');
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useNurseProfileQuery(userId);
  const orders = useNurseNursingRequestsQuery(
    profile.data?.verification === NurseVerification.APPROVED ? userId : undefined,
  );

  return (
    <Screen scroll className="px-5">
      <Text variant="titleMd" className="py-3">
        {t('tabs.orders')}
      </Text>
      <View className="gap-3 pb-6">
        {profile.isLoading ? <Spinner /> : null}
        {profile.data?.verification === NurseVerification.PENDING ? (
          <Card>
            <Text variant="bodySm">{t('pendingAccount')}</Text>
          </Card>
        ) : null}
        {profile.data?.verification === NurseVerification.REJECTED ? (
          <Card>
            <Text variant="bodySm">{t('rejectedAccount')}</Text>
          </Card>
        ) : null}
        {profile.data?.verification === NurseVerification.APPROVED && orders.isLoading ? <Spinner /> : null}
        {profile.data?.verification === NurseVerification.APPROVED && !orders.isLoading && (orders.data?.length ?? 0) === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : null}
        {orders.data?.map((request) => (
          <NursingOrderCard
            key={request.id}
            request={request}
            onPress={() => router.push(`/(nurse)/request/${request.id}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
