import { FlatList, RefreshControl, ScrollView, Pressable, View } from 'react-native';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import type { DoctorProfile } from '@/shared/types/models/doctor';

interface DoctorListProps {
  doctors: DoctorProfile[];
  specialties: string[];
  selectedSpecialty?: string;
  onSelectSpecialty?: (specialty?: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  hrefForDoctor?: (doctor: DoctorProfile) => Href;
  onPressDoctor?: (doctor: DoctorProfile) => void;
}

export function DoctorList({
  doctors,
  specialties,
  selectedSpecialty,
  onSelectSpecialty,
  isLoading,
  isError,
  isRefetching,
  onRefresh,
  onRetry,
  hrefForDoctor,
  onPressDoctor,
}: DoctorListProps) {
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const isDark = useResolvedColorScheme() === 'dark';
  const showSpecialtyFilters = Boolean(onSelectSpecialty && specialties.length > 0);

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
    return <ErrorState message={t('search.error')} onRetry={onRetry} retryLabel={tc('retry')} />;
  }

  const filterChips = showSpecialtyFilters ? (
    <View className="py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
        style={{ flexGrow: 0 }}
      >
        <Pressable
          onPress={() => onSelectSpecialty!(undefined)}
          className={`items-center justify-center rounded-full px-4 py-2 ${!selectedSpecialty ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')}`}
        >
          <Text
            variant="caption"
            className={cn('text-center', !selectedSpecialty ? 'text-white' : undefined)}
            muted={!!selectedSpecialty}
            numberOfLines={1}
          >
            {t('search.allSpecialties')}
          </Text>
        </Pressable>
        {specialties.map((specialty) => (
          <Pressable
            key={specialty}
            onPress={() => onSelectSpecialty!(specialty)}
            className={`items-center justify-center rounded-full px-4 py-2 ${selectedSpecialty === specialty ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')}`}
          >
            <Text
              variant="caption"
              className={cn('text-center', selectedSpecialty === specialty ? 'text-white' : undefined)}
              muted={selectedSpecialty !== specialty}
              numberOfLines={1}
            >
              {formatSpecialty(specialty, t)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  ) : null;

  if (doctors.length === 0) {
    return (
      <View className="flex-1 gap-3">
        {filterChips}
        <EmptyState
          title={t('search.empty.title')}
          description={t('search.empty.description')}
          icon={
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <Icon name="doctors" size={32} color="#0D9488" />
            </View>
          }
        />
      </View>
    );
  }

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id}
      className="flex-1"
      ListHeaderComponent={filterChips}
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
