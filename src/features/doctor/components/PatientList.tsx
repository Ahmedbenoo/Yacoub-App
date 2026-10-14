import { FlatList, RefreshControl, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PatientCard } from '@/features/doctor/components/PatientCard';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import type { PatientProfile } from '@/shared/types/models/patient';

interface PatientListProps {
  patients: PatientProfile[];
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForPatient?: (patient: PatientProfile) => Href;
  onPressPatient?: (patient: PatientProfile) => void;
}

export function PatientList({
  patients,
  isLoading,
  isError,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForPatient,
  onPressPatient,
}: PatientListProps) {
  const { t } = useTranslation('doctor');
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
    return <ErrorState message={t('patients.error')} onRetry={onRetry} retryLabel={tc('retry')} />;
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        title={t('patients.empty.title')}
        description={t('patients.empty.description')}
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="patients" size={32} color="#0D9488" />
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={patients}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-3 pb-8"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => (
        <PatientCard
          patient={item}
          href={hrefForPatient?.(item)}
          onPress={onPressPatient ? () => onPressPatient(item) : undefined}
        />
      )}
    />
  );
}
