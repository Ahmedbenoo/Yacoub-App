import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HomeVisitCard } from '@/features/home-visit/components/HomeVisitCard';
import {
  useDoctorHomeVisitsQuery,
  useEnableHomeVisitsMutation,
  useHomeVisitSettingQuery,
} from '@/features/home-visit/hooks/useHomeVisitQueries';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';

export function DoctorHomeVisitListScreen() {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');
  const doctorId = useAuthStore((s) => s.user?.id);
  const setting = useHomeVisitSettingQuery();
  const enableHomeVisits = useEnableHomeVisitsMutation();
  const enabled = Boolean(setting.data?.enabled);
  const { data, isLoading } = useDoctorHomeVisitsQuery(enabled ? doctorId : undefined);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('doctorListTitle')} />
      <View className="gap-4 py-4">
        {setting.isLoading ? <Spinner /> : null}

        {setting.isSuccess && !enabled ? (
          <Card className="gap-3">
            <Text variant="titleSm">{t('enableTitle')}</Text>
            <Text variant="bodySm" muted>
              {t('enableHint')}
            </Text>
            <Button
              title={t('enableAction')}
              fullWidth
              loading={enableHomeVisits.isPending}
              onPress={() => enableHomeVisits.mutate()}
            />
          </Card>
        ) : null}

        {enabled && isLoading ? <Spinner /> : null}
        {enabled && !isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState title={t('doctorEmptyTitle')} description={t('doctorEmptyDescription')} />
        ) : null}
        {enabled
          ? data?.map((request) => (
              <HomeVisitCard
                key={request.id}
                request={request}
                title={`${request.patientName} · ${formatSpecialty(request.specialty, tPatient)}`}
                onPress={() => router.push(`/(doctor)/home-visits/${request.id}` as never)}
              />
            ))
          : null}
      </View>
    </Screen>
  );
}
