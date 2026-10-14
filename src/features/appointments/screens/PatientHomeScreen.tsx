import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DashboardStats } from '@/features/appointments/components/DashboardStats';
import { NotificationsPreview } from '@/features/appointments/components/NotificationsPreview';
import { TodayOverview } from '@/features/appointments/components/TodayOverview';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { PatientGuestHome } from '@/features/patient/components/PatientGuestHome';
import { PatientPathChoices } from '@/features/patient/components/PatientPathChoices';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

interface PatientHomeScreenProps {
  appointmentsRoute: string;
  notificationsRoute: string;
}

export function PatientHomeScreen({ appointmentsRoute, notificationsRoute }: PatientHomeScreenProps) {
  const { t } = useTranslation('patient');
  const { user } = useCurrentUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Screen scroll>
      {isAuthenticated ? (
        <View className="gap-4 py-4">
          <View className="gap-1">
            <Text variant="titleMd">{t('dashboard.title')}</Text>
            <Text variant="bodySm" muted>
              {t('dashboard.welcome', { name: user?.firstName ?? '' })}
            </Text>
          </View>

          <DashboardStats role={UserRole.PATIENT} />

          <PatientPathChoices isAuthenticated />

          <Card elevated>
            <TodayOverview appointmentsRoute={appointmentsRoute} viewerRole={UserRole.PATIENT} />
          </Card>

          <Card elevated>
            <NotificationsPreview notificationsPath={notificationsRoute} />
          </Card>
        </View>
      ) : (
        <PatientGuestHome />
      )}
    </Screen>
  );
}
