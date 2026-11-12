import { FlatList, RefreshControl, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AdminSecretaryCard } from '@/features/admin/components/AdminSecretaryCard';
import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import type { SecretaryProfile } from '@/shared/types/models/admin';
import type { DoctorProfile } from '@/shared/types/models/doctor';

type TeamItem =
  | { type: 'doctor'; id: string; doctor: DoctorProfile }
  | { type: 'secretary'; id: string; secretary: SecretaryProfile };

interface AdminDoctorListProps {
  doctors: DoctorProfile[];
  secretaries?: SecretaryProfile[];
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForDoctor?: (doctor: DoctorProfile) => Href;
  hrefForSecretary?: (secretary: SecretaryProfile) => Href;
  onPressDoctor?: (doctor: DoctorProfile) => void;
}

export function AdminDoctorList({
  doctors,
  secretaries = [],
  isLoading,
  isError,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForDoctor,
  hrefForSecretary,
  onPressDoctor,
}: AdminDoctorListProps) {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const items: TeamItem[] = [
    ...doctors.map((doctor) => ({ type: 'doctor' as const, id: `doctor-${doctor.id}`, doctor })),
    ...secretaries.map((secretary) => ({
      type: 'secretary' as const,
      id: `secretary-${secretary.id}`,
      secretary,
    })),
  ];

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

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('staff.empty.title')}
        description={t('staff.empty.description')}
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
      data={items}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-3 pb-8"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) =>
        item.type === 'doctor' ? (
          <DoctorCard
            doctor={item.doctor}
            href={hrefForDoctor?.(item.doctor)}
            onPress={onPressDoctor ? () => onPressDoctor(item.doctor) : undefined}
          />
        ) : (
          <AdminSecretaryCard
            secretary={item.secretary}
            href={hrefForSecretary?.(item.secretary)}
          />
        )
      }
    />
  );
}
