import { FlatList, RefreshControl, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import type { DoctorProfile } from '@/shared/types/models/doctor';

interface AdminDoctorListProps {
  doctors: DoctorProfile[];
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForDoctor?: (doctor: DoctorProfile) => Href;
  onPressDoctor?: (doctor: DoctorProfile) => void;
}

export function AdminDoctorList({
  doctors,
  isLoading,
  isError,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForDoctor,
  onPressDoctor,
}: AdminDoctorListProps) {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');

  if (isLoading) {
    return (
      <View className="gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message={t('doctors.error')} onRetry={onRetry} retryLabel={tc('retry')} />;
  }

  if (doctors.length === 0) {
    return (
      <EmptyState
        title={t('doctors.empty.title')}
        description={t('doctors.empty.description')}
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="doctors" size={32} color="#0D9488" />
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-3 pb-8"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => (
        <DoctorCard
          doctor={item}
          href={hrefForDoctor?.(item)}
          onPress={onPressDoctor ? () => onPressDoctor(item) : undefined}
        />
      )}
    />
  );
}
