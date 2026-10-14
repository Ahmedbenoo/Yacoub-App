import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { getAppointmentHref } from '@/shared/navigation/routes';
import { UserRole } from '@/shared/types/enums';

interface ClinicAppointmentsPreviewProps {
  appointmentsRoute: string;
}

export function ClinicAppointmentsPreview({ appointmentsRoute }: ClinicAppointmentsPreviewProps) {
  const { t } = useTranslation('admin');
  const { data, isLoading, isError, refetch } = useAppointmentsQuery({ scope: 'upcoming', limit: 5 });

  return (
    <View className="gap-4">
      <SectionHeader
        title={t('dashboard.upcomingAppointments')}
        actionLabel={t('dashboard.viewAll')}
        onAction={() => router.push(appointmentsRoute as never)}
      />
      <AppointmentList
        appointments={data?.data ?? []}
        viewerRole={UserRole.ADMIN}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        hrefForItem={(appointment) => getAppointmentHref(UserRole.ADMIN, appointment.id)}
      />
    </View>
  );
}
