import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DashboardStats } from '@/features/appointments/components/DashboardStats';
import { NotificationsPreview } from '@/features/appointments/components/NotificationsPreview';
import { TodayOverview } from '@/features/appointments/components/TodayOverview';
import { DoctorAdminRoleToggle } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useEnableHomeVisitsMutation, useHomeVisitSettingQuery } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { UserRole } from '@/shared/types/enums';

interface DoctorDashboardScreenProps {
  appointmentsRoute: string;
  notificationsRoute: string;
}

export function DoctorDashboardScreen({ appointmentsRoute, notificationsRoute }: DoctorDashboardScreenProps) {
  const { t } = useTranslation('doctor');
  const { user } = useCurrentUser();
  const { rowStyle } = useLayoutDirection();
  const homeVisits = useHomeVisitSettingQuery();
  const enableHomeVisits = useEnableHomeVisitsMutation();

  return (
    <Screen scroll>
      <View className="gap-4 py-4">
        <View className="items-start justify-between gap-3" style={rowStyle}>
          <View className="min-w-0 flex-1 gap-1">
            <Text variant="titleMd">{t('dashboard.title')}</Text>
            <Text variant="bodySm" muted>
              {t('dashboard.welcome', { name: user?.firstName ?? '' })}
            </Text>
          </View>
          <DoctorAdminRoleToggle />
        </View>

        <DashboardStats role={UserRole.DOCTOR} />

        <Card elevated>
          <TodayOverview appointmentsRoute={appointmentsRoute} viewerRole={UserRole.DOCTOR} />
        </Card>

        {homeVisits.data?.enabled ? (
          <Card className="gap-3">
            <Text variant="titleSm">{t('dashboard.homeVisitsTitle')}</Text>
            <Text variant="bodySm" muted>
              {t('dashboard.homeVisitsHint')}
            </Text>
            <Button
              title={t('dashboard.openHomeVisits')}
              variant="outline"
              onPress={() => router.push('/(doctor)/home-visits' as never)}
            />
          </Card>
        ) : homeVisits.isSuccess ? (
          <Card className="gap-3">
            <Text variant="bodySm" muted>
              {t('dashboard.homeVisitsEnableHint')}
            </Text>
            <Button
              title={t('dashboard.homeVisitsEnable')}
              variant="outline"
              loading={enableHomeVisits.isPending}
              onPress={() => enableHomeVisits.mutate()}
            />
          </Card>
        ) : null}

        <Card elevated>
          <NotificationsPreview notificationsPath={notificationsRoute} />
        </Card>
      </View>
    </Screen>
  );
}
