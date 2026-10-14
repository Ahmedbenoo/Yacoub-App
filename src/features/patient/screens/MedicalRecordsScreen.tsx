import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MedicalRecordsList } from '@/features/patient/components/MedicalRecordsList';
import { useMyMedicalHistoryQuery, useMyPatientProfileQuery } from '@/features/patients/hooks/usePatientRecordsQueries';
import { Screen } from '@/shared/components/layout/Screen';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { GuestPrompt } from '@/shared/components/feedback/GuestPrompt';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { getPatientHealthProfileHref } from '@/shared/navigation/routes';
import type { MedicalRecordFilter } from '@/shared/types/models/patient';

const FILTERS: MedicalRecordFilter[] = ['all', 'prescription', 'lab', 'visit'];

export function MedicalRecordsScreen() {
  const { t } = useTranslation('patient');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDark = useResolvedColorScheme() === 'dark';
  const { forwardIconName } = useLayoutDirection();
  const [filter, setFilter] = useState<MedicalRecordFilter>('all');

  const { data: profile, isLoading: profileLoading } = useMyPatientProfileQuery();
  const { data: history, isLoading: historyLoading, isError, refetch } = useMyMedicalHistoryQuery();

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (filter === 'all') return history;
    return history.filter((entry) => entry.type === filter);
  }, [history, filter]);

  if (!isAuthenticated) {
    return (
      <Screen>
        <GuestPrompt title={t('guest.recordsTitle')} description={t('guest.recordsDescription')} />
      </Screen>
    );
  }

  if (profileLoading || historyLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={t('records.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll className="pt-4">
      <Text variant="titleLg" className="mb-4">
        {t('records.title')}
      </Text>

      {profile && (
        <Card elevated className="mb-4 overflow-hidden p-0">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('records.subtitle')}
            className="flex-row items-center gap-3 p-4 active:opacity-80"
            onPress={() => router.push(getPatientHealthProfileHref())}
          >
            <Avatar firstName={profile.firstName} lastName={profile.lastName} size="md" />
            <View className="flex-1 gap-1">
              <Text variant="titleSm">
                {profile.firstName} {profile.lastName}
              </Text>
              <Text variant="bodySm" muted>
                {t('records.subtitle')}
              </Text>
            </View>
            <Icon name={forwardIconName} size={20} color="#94A3B8" />
          </Pressable>
        </Card>
      )}

      <View className="mb-4 flex-row flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            className={`rounded-full px-4 py-2 ${
              filter === option ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')
            }`}
          >
            <Text variant="caption" className={filter === option ? 'text-white' : undefined}>
              {t(`records.filters.${option}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {!filteredHistory.length ? (
        <EmptyState
          title={t('records.empty.title')}
          description={t('records.empty.description')}
          icon={
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <Icon name="records" size={32} color="#0D9488" />
            </View>
          }
        />
      ) : (
        <MedicalRecordsList entries={filteredHistory} />
      )}
    </Screen>
  );
}
