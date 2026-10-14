import { FlatList, RefreshControl, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentCard } from '@/features/appointments/components/AppointmentCard';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import type { Appointment } from '@/shared/types/models/appointment';
import { UserRole } from '@/shared/types/enums';

interface AppointmentListProps {
  appointments: Appointment[];
  viewerRole: UserRole;
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForItem?: (appointment: Appointment) => Href;
  onPressItem?: (appointment: Appointment) => void;
}

export function AppointmentList({
  appointments,
  viewerRole,
  isLoading = false,
  isError = false,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForItem,
  onPressItem,
}: AppointmentListProps) {
  const { t } = useTranslation('appointments');
  const { t: tc } = useTranslation('common');

  if (isLoading) {
    return (
      <View className="gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState message={t('error')} onRetry={onRetry} retryLabel={tc('retry')} />
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title={t('empty.title')}
        description={t('empty.description')}
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="calendarEmpty" size={32} color="#0D9488" />
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-3 pb-8"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => (
        <AppointmentCard
          appointment={item}
          viewerRole={viewerRole}
          href={hrefForItem?.(item)}
          onPress={onPressItem ? () => onPressItem(item) : undefined}
        />
      )}
    />
  );
}
