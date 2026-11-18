import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DashboardStats } from '@/features/appointments/components/DashboardStats';
import { TodayOverview } from '@/features/appointments/components/TodayOverview';
import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { PatientGuestHome } from '@/features/patient/components/PatientGuestHome';
import { PatientHomeCatalogRails } from '@/features/patient/components/PatientHomeCatalogRails';
import { PatientPathChoices } from '@/features/patient/components/PatientPathChoices';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import { AppointmentStatus, UserRole } from '@/shared/types/enums';

interface PatientHomeScreenProps {
  appointmentsRoute: string;
}

export function PatientHomeScreen({ appointmentsRoute }: PatientHomeScreenProps) {
  const { t } = useTranslation('patient');
  const { user } = useCurrentUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const todayQuery = useAppointmentsQuery(
    { scope: 'today', patientId: user?.id, limit: 3 },
    isAuthenticated && Boolean(user?.id),
  );
  const todayAppointments = (todayQuery.data?.data ?? []).filter(
    (appointment) =>
      appointment.status !== AppointmentStatus.CANCELLED &&
      appointment.status !== AppointmentStatus.COMPLETED &&
      appointment.status !== AppointmentStatus.NO_SHOW,
  );
  const hasTodayAppointments = todayAppointments.length > 0;
  const showCatalog = !todayQuery.isLoading && !hasTodayAppointments;

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

          <PatientPathChoices isAuthenticated />

          <DashboardStats role={UserRole.PATIENT} />

          {hasTodayAppointments ? (
            <Card elevated>
              <TodayOverview appointmentsRoute={appointmentsRoute} viewerRole={UserRole.PATIENT} />
            </Card>
          ) : null}

          {showCatalog ? <PatientHomeCatalogRails /> : null}
        </View>
      ) : (
        <PatientGuestHome />
      )}
    </Screen>
  );
}
