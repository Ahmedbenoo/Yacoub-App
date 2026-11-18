import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { NursingOrderCard } from '@/features/nursing/components/NursingOrderCard';
import { usePatientNursingRequestsQuery } from '@/features/nursing/hooks/useNursingQueries';
import { GuestAccountCard } from '@/features/patient/components/GuestAccountCard';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
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
import type { Appointment, AppointmentFilters } from '@/shared/types/models/appointment';

type ScopeTab = 'all' | 'today' | 'upcoming' | 'past';
type PatientSection = 'clinic' | 'nursing';
type StatusFilter = 'all' | AppointmentStatus;

interface AppointmentsListScreenProps {
  viewerRole: UserRole;
  compactTitle?: boolean;
  showStatusFilter?: boolean;
}

const UPCOMING_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
];

const TODAY_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
];

const PAST_STATUS_FILTERS: StatusFilter[] = [
  'all',
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

function getStatusFiltersForTab(tab: ScopeTab): StatusFilter[] {
  if (tab === 'upcoming') return UPCOMING_STATUS_FILTERS;
  if (tab === 'today') return TODAY_STATUS_FILTERS;
  if (tab === 'past') return PAST_STATUS_FILTERS;
  return [];
}

function sortAppointments(appointments: Appointment[], tab: ScopeTab): Appointment[] {
  const copy = [...appointments];
  const now = Date.now();
  copy.sort((left, right) => {
    const leftTime = new Date(left.scheduledAt).getTime();
    const rightTime = new Date(right.scheduledAt).getTime();
    if (tab === 'past') return rightTime - leftTime;
    if (tab === 'all') {
      const leftPast = leftTime < now;
      const rightPast = rightTime < now;
      if (leftPast !== rightPast) return leftPast ? 1 : -1;
      return leftPast ? rightTime - leftTime : leftTime - rightTime;
    }
    return leftTime - rightTime;
  });
  return copy;
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
  const [activeTab, setActiveTab] = useState<ScopeTab>(
    scopeParam === 'today' ? 'today' : scopeParam === 'completed' ? 'past' : 'all',
  );
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

  const statusFilters = getStatusFiltersForTab(activeTab).filter(
    (filter) => viewerRole !== UserRole.PATIENT || filter !== AppointmentStatus.IN_PROGRESS,
  );
  const isPatient = viewerRole === UserRole.PATIENT;
  const showNursing = isPatient && section === 'nursing';
  const showScopedStatusFilter = showStatusFilter && !showNursing && statusFilters.length > 0;

  const filters: AppointmentFilters = useMemo(() => {
    const base: AppointmentFilters = {
      scope: activeTab,
      limit: 50,
      doctorId: viewerRole === UserRole.DOCTOR ? user?.id : undefined,
      patientId: viewerRole === UserRole.PATIENT ? user?.id : undefined,
    };

    if (showStatusFilter && statusFilter !== 'all') {
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
      <Screen className="pt-4">
        <Text variant="titleLg" className="mb-4">
          {t('title')}
        </Text>
        <GuestAccountCard />
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
        <Row className="mb-4 flex-wrap gap-2">
          {(
            [
              { value: 'all', label: t('filters.all') },
              { value: 'today', label: t('today') },
              { value: 'upcoming', label: t('tabs.upcoming') },
              { value: 'past', label: t('tabs.past') },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => {
                if (tab.value !== activeTab) setStatusFilter('all');
                setActiveTab(tab.value);
              }}
              className={cn(
                'rounded-full px-3 py-2',
                activeTab === tab.value ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700'),
              )}
            >
              <Text variant="caption" className={cn(activeTab === tab.value ? 'text-white' : undefined)}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </Row>
      )}

      {showNursing ? <PatientNursingTab userId={user?.id} /> : null}

      {showScopedStatusFilter && (
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
          appointments={sortAppointments(data?.data ?? [], activeTab)}
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
