import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNursingPriceRange } from '@/shared/catalog/nursing-services';
import { NursingRequestSummary } from '@/features/nursing/components/NursingRequestSummary';
import {
  useAssignNurseMutation,
  useNursesQuery,
  useNursingRequestQuery,
  usePriceNursingRequestMutation,
} from '@/features/nursing/hooks/useNursingQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { HomeNursingStatus, NurseVerification } from '@/shared/types/enums';

export function NursingAdminOrderDetailScreen() {
  const { t } = useTranslation('nursing');
  const id = useRouteIdParam();
  const { data, isLoading } = useNursingRequestQuery(id);
  const { data: nurses } = useNursesQuery();
  const priceMutation = usePriceNursingRequestMutation();
  const assignMutation = useAssignNurseMutation();
  const [price, setPrice] = useState('');
  const [nurseUserId, setNurseUserId] = useState('');

  useEffect(() => {
    if (!data) return;
    setPrice(String(data.price ?? data.priceMin ?? ''));
  }, [data]);

  const verified = (nurses ?? []).filter((nurse) => nurse.verification === NurseVerification.APPROVED);
  const canPrice = data?.status === HomeNursingStatus.REQUESTED || data?.status === HomeNursingStatus.PRICED;
  const canAssign = data?.status === HomeNursingStatus.PRICED || data?.status === HomeNursingStatus.DECLINED;

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('adminTitle')} />
      <View className="gap-4 py-4">
        {isLoading || !data ? (
          <Spinner />
        ) : (
          <>
            <NursingRequestSummary request={data} />

            {canPrice ? (
              <Card className="gap-3">
                {data.priceMin && data.priceMax ? (
                  <Text variant="bodySm" muted>
                    {t('expectedPrice')}: {formatNursingPriceRange(data.priceMin, data.priceMax)} {t('currency')}
                  </Text>
                ) : null}
                <Input
                  label={t('price')}
                  placeholder={t('pricePlaceholder')}
                  keyboardType="number-pad"
                  value={price}
                  onChangeText={setPrice}
                />
                <Button
                  title={t('notify')}
                  loading={priceMutation.isPending}
                  onPress={() => priceMutation.mutate({ id, price: Number(price || data.price) })}
                  fullWidth
                />
              </Card>
            ) : null}

            {canAssign ? (
              <Card className="gap-3">
                <Text variant="label">{t('verifiedNurses')}</Text>
                {verified.length === 0 ? <Text variant="bodySm" muted>{t('noVerifiedNurses')}</Text> : null}
                {verified.map((nurse) => {
                  const selected = nurseUserId === nurse.userId;
                  return (
                    <Pressable key={nurse.userId} accessibilityRole="button" onPress={() => setNurseUserId(nurse.userId)}>
                      <Card className={`flex-row items-center gap-3 ${selected ? 'border-2 border-primary-600' : ''}`}>
                        <Avatar firstName={nurse.firstName} lastName={nurse.lastName} size="sm" />
                        <Text variant="label" className="min-w-0 flex-1">
                          {nurse.firstName} {nurse.lastName}
                        </Text>
                      </Card>
                    </Pressable>
                  );
                })}
                <Button
                  title={t('sendNurse')}
                  disabled={!nurseUserId}
                  loading={assignMutation.isPending}
                  onPress={() => assignMutation.mutate({ id, nurseUserId })}
                  fullWidth
                />
              </Card>
            ) : null}

            {data.status === HomeNursingStatus.ASSIGNED ? (
              <Text variant="bodySm" muted>
                {t('waitingNurse')}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
