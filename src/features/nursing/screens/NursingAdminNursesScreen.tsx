import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useNursesQuery, useVerifyNurseMutation } from '@/features/nursing/hooks/useNursingQueries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Screen } from '@/shared/components/layout/Screen';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { NurseVerification } from '@/shared/types/enums';

export function NursingAdminNursesScreen() {
  const { t } = useTranslation('nursing');
  const { data, isLoading } = useNursesQuery();
  const verify = useVerifyNurseMutation();

  return (
    <Screen scroll className="px-5">
      <Text variant="titleMd" className="py-3">
        {t('nursesTitle')}
      </Text>
      <View className="gap-3 pb-6">
        {isLoading ? <Spinner /> : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : null}
        {data?.map((nurse) => (
          <Card key={nurse.userId} className="gap-3">
            <View className="flex-row items-center gap-3">
              <Avatar firstName={nurse.firstName} lastName={nurse.lastName} size="md" />
              <View className="min-w-0 flex-1 gap-1">
                <Text variant="titleSm" numberOfLines={1}>
                  {nurse.firstName} {nurse.lastName}
                </Text>
                <Text variant="bodySm" muted numberOfLines={1}>
                  {nurse.email}
                </Text>
              </View>
              <Badge
                label={t(`verification.${nurse.verification}`)}
                variant={
                  nurse.verification === NurseVerification.APPROVED
                    ? 'success'
                    : nurse.verification === NurseVerification.REJECTED
                      ? 'error'
                      : 'warning'
                }
              />
            </View>
            <Text variant="bodySm">
              {t('proof')}: {nurse.proof}
            </Text>
            {nurse.verification !== NurseVerification.APPROVED ? (
              <View className="gap-2">
                <Button
                  title={t('approve')}
                  onPress={() =>
                    verify.mutate({ userId: nurse.userId, verification: NurseVerification.APPROVED })
                  }
                  fullWidth
                />
                {nurse.verification !== NurseVerification.REJECTED ? (
                  <Button
                    title={t('reject')}
                    variant="outline"
                    onPress={() =>
                      verify.mutate({ userId: nurse.userId, verification: NurseVerification.REJECTED })
                    }
                    fullWidth
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
