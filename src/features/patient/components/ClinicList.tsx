import { FlatList, RefreshControl, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/features/patient/components/ClinicCard';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { Icon } from '@/shared/components/ui/Icon';
import type { Clinic } from '@/shared/types/models';

interface ClinicListProps {
  clinics: Clinic[];
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForClinic?: (clinic: Clinic) => Href;
  onPressClinic?: (clinic: Clinic) => void;
}

export function ClinicList({
  clinics,
  isLoading,
  isError,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForClinic,
  onPressClinic,
}: ClinicListProps) {
  const { t } = useTranslation('patient');
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
    return <ErrorState message={t('clinicSearch.error')} onRetry={onRetry} retryLabel={tc('retry')} />;
  }

  if (clinics.length === 0) {
    return (
      <EmptyState
        title={t('clinicSearch.empty.title')}
        description={t('clinicSearch.empty.description')}
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="clinic" size={32} color="#0D9488" />
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={clinics}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-3 pb-8"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => (
        <ClinicCard
          clinic={item}
          href={hrefForClinic?.(item)}
          onPress={onPressClinic ? () => onPressClinic(item) : undefined}
        />
      )}
    />
  );
}
