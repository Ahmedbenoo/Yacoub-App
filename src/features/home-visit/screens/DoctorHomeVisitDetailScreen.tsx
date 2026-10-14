import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeVisitSummary } from '@/features/home-visit/components/HomeVisitSummary';
import {
  useAcceptHomeVisitMutation,
  useCompleteHomeVisitMutation,
  useHomeVisitQuery,
} from '@/features/home-visit/hooks/useHomeVisitQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { HomeVisitStatus } from '@/shared/types/enums';

export function DoctorHomeVisitDetailScreen() {
  const { t } = useTranslation('homeVisit');
  const id = useRouteIdParam();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useHomeVisitQuery(id);
  const accept = useAcceptHomeVisitMutation();
  const complete = useCompleteHomeVisitMutation();
  const [price, setPrice] = useState('');
  const amount = Number(price);
  const canAccept = data?.status === HomeVisitStatus.REQUESTED;
  const canComplete = data?.status === HomeVisitStatus.ACCEPTED && data.doctorId === user?.id;

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('doctorDetailTitle')} />
      <View className="gap-4 py-4">
        {isLoading || !data || !user ? (
          <Spinner />
        ) : (
          <>
            <HomeVisitSummary request={data} />
            {canAccept ? (
              <Card className="gap-3">
                <Input
                  label={t('price')}
                  placeholder={t('pricePlaceholder')}
                  keyboardType="number-pad"
                  value={price}
                  onChangeText={setPrice}
                />
                <Button
                  title={t('accept')}
                  disabled={!Number.isFinite(amount) || amount <= 0}
                  loading={accept.isPending}
                  onPress={() =>
                    accept.mutate({
                      id,
                      doctorId: user.id,
                      doctorName: `${user.firstName} ${user.lastName}`.trim(),
                      price: amount,
                    })
                  }
                  fullWidth
                />
              </Card>
            ) : null}
            {canComplete ? (
              <Button
                title={t('complete')}
                loading={complete.isPending}
                onPress={() => complete.mutate({ id, doctorId: user.id })}
                fullWidth
              />
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
