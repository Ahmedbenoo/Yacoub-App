import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentCard } from '@/features/appointments/components/AppointmentCard';
import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { getAppointmentHref } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

interface TodayOverviewProps {
  appointmentsRoute: string;
  viewerRole: UserRole;
}

export function TodayOverview({ appointmentsRoute, viewerRole }: TodayOverviewProps) {
  const { t } = useTranslation('appointments');
  const user = useAuthStore((s) => s.user);

  const filters = {
    scope: 'today' as const,
    doctorId: viewerRole === UserRole.DOCTOR ? user?.id : undefined,
    patientId: viewerRole === UserRole.PATIENT ? user?.id : undefined,
    limit: 3,
  };

  const { data, isLoading } = useAppointmentsQuery(filters, Boolean(user));

  return (
    <View className="gap-4">
      <SectionHeader
        title={t('overview.todayTitle')}
        actionLabel={t('overview.viewAll')}
        onAction={() => router.push(appointmentsRoute as never)}
      />

      {isLoading && (
        <View className="gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title={t('empty.title')}
          description={t('empty.description')}
          icon={
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <Icon name="calendarEmpty" size={32} color="#0D9488" />
            </View>
          }
        />
      )}

      {!isLoading &&
        data?.data.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            viewerRole={viewerRole}
            href={getAppointmentHref(viewerRole, appointment.id)}
          />
        ))}
    </View>
  );
}
