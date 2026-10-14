import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { NursingOrderCard } from '@/features/nursing/components/NursingOrderCard';
import { usePatientNursingRequestsQuery } from '@/features/nursing/hooks/useNursingQueries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { GuestPrompt } from '@/shared/components/feedback/GuestPrompt';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { getAppointmentHref } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { AppointmentStatus, UserRole } from '@/shared/types/enums';
import type { AppointmentFilters } from '@/shared/types/models/appointment';

type ScopeTab = 'today' | 'upcoming' | 'past' | 'noshow';
type PatientSection = 'clinic' | 'nursing';
type StatusFilter = 'all' | AppointmentStatus;

interface AppointmentsListScreenProps {
  viewerRole: UserRole;
  compactTitle?: boolean;
  showStatusFilter?: boolean;
}

const ADMIN_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

const DOCTOR_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
];

const PATIENT_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CANCELLED,
];

function getStatusFiltersForRole(role: UserRole): StatusFilter[] {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.SECRETARY:
      return ADMIN_STATUS_FILTERS;
    case UserRole.DOCTOR:
      return DOCTOR_STATUS_FILTERS;
    case UserRole.PATIENT:
      return PATIENT_STATUS_FILTERS;
    default:
      return ADMIN_STATUS_FILTERS;
  }
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function PatientNursingTab({ userId }: { userId?: string }) {
  const { t } = useTranslation('nursing');
  const { data, isLoading } = usePatientNursingRequestsQuery(userId);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-8" showsVerticalScrollIndicator={false}>
      <Button
        title={t('requestAction')}
        onPress={() => router.push('/(patient)/nursing/new' as never)}
        fullWidth
      />
      {isLoading ? <Spinner /> : null}
      {!isLoading && (data?.length ?? 0) === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : null}
      {data?.map((request) => (
        <NursingOrderCard
          key={request.id}
          request={request}
          onPress={() => router.push(`/(patient)/nursing/${request.id}` as never)}
        />
      ))}
    </ScrollView>
  );
}

export function AppointmentsListScreen({
  viewerRole,
  compactTitle = false,
  showStatusFilter = false,
}: AppointmentsListScreenProps) {
  const { t } = useTranslation('appointments');
  const user = useAuthStore((s) => s.user);
  const isDark = useResolvedColorScheme() === 'dark';
  const params = useLocalSearchParams<{ scope?: string | string[]; focus?: string | string[] }>();
  const scopeParam = readParam(params.scope);
  const focusParam = readParam(params.focus);
  const [section, setSection] = useState<PatientSection>('clinic');
  const [activeTab, setActiveTab] = useState<ScopeTab>(scopeParam === 'today' ? 'today' : 'upcoming');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    scopeParam === 'scheduled' ? AppointmentStatus.SCHEDULED : 'all',
  );

  useEffect(() => {
    if (!focusParam) return;
    if (scopeParam === 'today') {
      setSection('clinic');
      setActiveTab('today');
      setStatusFilter('all');
      return;
    }
    if (scopeParam === 'scheduled') {
      setSection('clinic');
      setActiveTab('upcoming');
      setStatusFilter(AppointmentStatus.SCHEDULED);
      return;
    }
    if (scopeParam === 'completed') {
      setSection('clinic');
      setActiveTab('past');
      setStatusFilter('all');
    }
  }, [focusParam, scopeParam]);

  const statusFilters = getStatusFiltersForRole(viewerRole);
  const isPatient = viewerRole === UserRole.PATIENT;
  const showNursing = isPatient && section === 'nursing';

  const filters: AppointmentFilters = useMemo(() => {
    const base: AppointmentFilters = {
      scope: activeTab === 'noshow' ? 'past' : activeTab,
      doctorId: viewerRole === UserRole.DOCTOR ? user?.id : undefined,
      patientId: viewerRole === UserRole.PATIENT ? user?.id : undefined,
    };
    if (activeTab === 'noshow') {
      base.status = AppointmentStatus.NO_SHOW;
    }

    const canFilterStatus = activeTab === 'upcoming';
    if (showStatusFilter && canFilterStatus && statusFilter !== 'all') {
      base.status = statusFilter;
    }

    return base;
  }, [activeTab, showStatusFilter, statusFilter, user?.id, viewerRole]);

  const { data, isLoading, isError, refetch, isRefetching } = useAppointmentsQuery(
    filters,
    Boolean(user) && !showNursing,
  );

  if (viewerRole === UserRole.PATIENT && !user) {
    return (
      <Screen>
        <GuestPrompt title={t('guest.title')} description={t('guest.description')} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} className="flex-1 px-5 pt-3">
      <Text variant={compactTitle ? 'titleMd' : 'titleLg'} className="mb-3">
        {t('title')}
      </Text>

      {viewerRole === UserRole.ADMIN || viewerRole === UserRole.SECRETARY ? (
        <View className="mb-4 gap-2">
          <Button
            title={t('queue.open')}
            variant="outline"
            fullWidth
            onPress={() =>
              router.push(
                (viewerRole === UserRole.ADMIN ? '/(admin)/queue' : '/(secretary)/queue') as never,
              )
            }
          />
          <Button
            title={t('billing.dayClose')}
            variant="outline"
            fullWidth
            onPress={() =>
              router.push(
                (viewerRole === UserRole.ADMIN ? '/(admin)/day-close' : '/(secretary)/day-close') as never,
              )
            }
          />
        </View>
      ) : null}

      {isPatient ? (
        <View className="mb-4">
          <SegmentedControl
            options={[
              { value: 'clinic', label: t('tabs.clinic') },
              { value: 'nursing', label: t('tabs.nursing') },
            ]}
            value={section}
            onChange={setSection}
          />
        </View>
      ) : null}

      {showNursing ? null : (
        <View className="mb-4">
          <SegmentedControl
            options={[
              { value: 'today', label: t('today') },
              { value: 'upcoming', label: t('tabs.upcoming') },
              { value: 'past', label: t('tabs.past') },
              ...(showStatusFilter ? [{ value: 'noshow' as const, label: t('tabs.noShow') }] : []),
            ]}
            value={activeTab}
            onChange={(tab) => {
              if (tab !== activeTab) setStatusFilter('all');
              setActiveTab(tab);
            }}
          />
        </View>
      )}

      {showNursing ? <PatientNursingTab userId={user?.id} /> : null}

      {showStatusFilter && !showNursing && activeTab === 'upcoming' && (
        <Row className="mb-4 flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setStatusFilter(filter)}
              className={cn(
                'rounded-full px-3 py-2',
                statusFilter === filter ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700'),
              )}
            >
              <Text
                variant="caption"
                className={cn(statusFilter === filter ? 'text-white' : undefined)}
              >
                {filter === 'all' ? t('filters.all') : t(`status.${filter}`)}
              </Text>
            </Pressable>
          ))}
        </Row>
      )}

      {showNursing ? null : (
        <AppointmentList
          appointments={data?.data ?? []}
          viewerRole={viewerRole}
          isLoading={isLoading}
          isError={isError}
          isRefetching={isRefetching}
          onRefresh={() => refetch()}
          onRetry={() => refetch()}
          hrefForItem={(appointment) => getAppointmentHref(viewerRole, appointment.id)}
        />
      )}
    </Screen>
  );
}
