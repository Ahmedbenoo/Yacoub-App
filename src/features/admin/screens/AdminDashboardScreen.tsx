import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicAppointmentsPreview } from '@/features/admin/components/ClinicAppointmentsPreview';
import { ClinicStatsGrid } from '@/features/admin/components/ClinicStatsGrid';
import { ReportsList } from '@/features/admin/components/ReportsList';
import { useClinicReportsQuery, useClinicStatsQuery } from '@/features/admin/hooks';
import { DoctorAdminRoleToggle } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useActiveClinicQuery } from '@/features/clinic/hooks';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getAdminReportsListHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

export function AdminDashboardScreen() {
  const { t } = useTranslation('admin');
  const { t: ta } = useTranslation('appointments');
  const { user } = useCurrentUser();
  const locale = useLocaleStore((s) => s.locale);
  const { rowStyle } = useLayoutDirection();
  const { data: activeClinic } = useActiveClinicQuery();
  const { data: stats, isLoading: statsLoading } = useClinicStatsQuery();
  const { data: reports, isLoading: reportsLoading } = useClinicReportsQuery();

  return (
    <Screen scroll>
      <View className="gap-4 py-4">
        <View className="items-start justify-between gap-3" style={rowStyle}>
          <View className="min-w-0 flex-1 gap-1">
            <Text variant="titleMd">{t('dashboard.title')}</Text>
            <Text variant="bodySm" muted>
              {t('dashboard.welcome', { name: user?.firstName ?? '' })}
            </Text>
            {activeClinic && (
              <Text variant="label" className="text-primary-600 dark:text-primary-400">
                {getClinicName(activeClinic, locale)}
              </Text>
            )}
          </View>
          <DoctorAdminRoleToggle />
        </View>

        {statsLoading && <Spinner />}
        {stats && <ClinicStatsGrid stats={stats} />}

        <Card elevated>
          <ClinicAppointmentsPreview appointmentsRoute="/(admin)/(tabs)/appointments" />
        </Card>

        <View className="gap-2">
          <Button title={ta('queue.open')} variant="outline" fullWidth onPress={() => router.push('/(admin)/queue')} />
          <Button
            title={ta('billing.dayClose')}
            variant="outline"
            fullWidth
            onPress={() => router.push('/(admin)/day-close')}
          />
        </View>

        <View className="gap-3">
          <SectionHeader
            title={t('reports.title')}
            actionLabel={t('dashboard.viewAll')}
            onAction={() => router.push(getAdminReportsListHref(), { withAnchor: true })}
          />
          {reportsLoading && <Spinner />}
          {reports && <ReportsList reports={reports} />}
        </View>
      </View>
    </Screen>
  );
}
