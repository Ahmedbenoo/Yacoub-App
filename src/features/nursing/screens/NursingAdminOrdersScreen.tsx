import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NursingOrderCard } from '@/features/nursing/components/NursingOrderCard';
import { useAdminNursingRequestsQuery } from '@/features/nursing/hooks/useNursingQueries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export function NursingAdminOrdersScreen() {
  const { t } = useTranslation('nursing');
  const { data, isLoading } = useAdminNursingRequestsQuery();

  return (
    <Screen scroll className="px-5">
      <Text variant="titleMd" className="py-3">
        {t('adminTitle')}
      </Text>
      <View className="gap-3 pb-6">
        {isLoading ? <Spinner /> : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : null}
        {data?.map((request) => (
          <NursingOrderCard
            key={request.id}
            request={request}
            onPress={() => router.push(`/(nursing-admin)/request/${request.id}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
