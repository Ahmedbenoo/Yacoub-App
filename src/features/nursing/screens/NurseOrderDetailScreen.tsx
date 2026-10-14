import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NursingRequestSummary } from '@/features/nursing/components/NursingRequestSummary';
import { useNurseRespondMutation, useNursingRequestQuery } from '@/features/nursing/hooks/useNursingQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { HomeNursingStatus } from '@/shared/types/enums';

export function NurseOrderDetailScreen() {
  const { t } = useTranslation('nursing');
  const id = useRouteIdParam();
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const { data, isLoading } = useNursingRequestQuery(id);
  const respond = useNurseRespondMutation();
  const mine = data?.nurseUserId === userId;

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('tabs.orders')} />
      <View className="gap-4 py-4">
        {isLoading || !data ? (
          <Spinner />
        ) : (
          <>
          <NursingRequestSummary request={data} />
          <Card className="gap-3">
            {mine && data.status === HomeNursingStatus.ASSIGNED ? (
              <View className="gap-2">
                <Button
                  title={t('accept')}
                  loading={respond.isPending}
                  onPress={() => respond.mutate({ id, nurseUserId: userId, action: 'accept' })}
                  fullWidth
                />
                <Button
                  title={t('decline')}
                  variant="outline"
                  onPress={() => respond.mutate({ id, nurseUserId: userId, action: 'decline' })}
                  fullWidth
                />
              </View>
            ) : null}
            {mine && data.status === HomeNursingStatus.ACCEPTED ? (
              <Button
                title={t('complete')}
                loading={respond.isPending}
                onPress={() => respond.mutate({ id, nurseUserId: userId, action: 'complete' })}
                fullWidth
              />
            ) : null}
          </Card>
          </>
        )}
      </View>
    </Screen>
  );
}
