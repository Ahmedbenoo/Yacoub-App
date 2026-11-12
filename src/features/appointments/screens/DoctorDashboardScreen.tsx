import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DashboardStats } from '@/features/appointments/components/DashboardStats';
import { TodayOverview } from '@/features/appointments/components/TodayOverview';
import { DoctorAdminRoleToggle } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { DoctorHomeVisitNavRow } from '@/features/home-visit/components/DoctorHomeVisitNavRow';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { UserRole } from '@/shared/types/enums';

interface DoctorDashboardScreenProps {
  appointmentsRoute: string;
}

export function DoctorDashboardScreen({ appointmentsRoute }: DoctorDashboardScreenProps) {
  const { t } = useTranslation('doctor');
  const { user } = useCurrentUser();
  const { rowStyle } = useLayoutDirection();

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

        <DoctorHomeVisitNavRow />

        <Card elevated>
          <TodayOverview appointmentsRoute={appointmentsRoute} viewerRole={UserRole.DOCTOR} />
        </Card>
      </View>
    </Screen>
  );
}
