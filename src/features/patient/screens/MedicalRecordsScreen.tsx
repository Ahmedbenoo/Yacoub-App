import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MedicalRecordsList } from '@/features/patient/components/MedicalRecordsList';
import { UploadMedicalDocumentSheet } from '@/features/patient/components/UploadMedicalDocumentSheet';
import { UploadRecordsCard } from '@/features/patient/components/UploadRecordsCard';
import { useMyMedicalHistoryQuery } from '@/features/patients/hooks/usePatientRecordsQueries';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { GuestAccountCard } from '@/features/patient/components/GuestAccountCard';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { getPatientHealthProfileHref } from '@/shared/navigation/routes';
import type { MedicalDocumentKind, MedicalRecordFilter } from '@/shared/types/models/patient';

const FILTERS: MedicalRecordFilter[] = ['all', 'visit', 'prescription', 'lab', 'radiology'];

export function MedicalRecordsScreen() {
  const { t } = useTranslation('patient');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDark = useResolvedColorScheme() === 'dark';
  const { forwardIconName } = useLayoutDirection();
  const [filter, setFilter] = useState<MedicalRecordFilter>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadKind, setUploadKind] = useState<MedicalDocumentKind>('prescription');

  const openUpload = (kind: MedicalDocumentKind) => {
    setUploadKind(kind);
    setUploadOpen(true);
  };

  const { data: history, isLoading: historyLoading, isError, refetch } = useMyMedicalHistoryQuery();

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (filter === 'all') return history;
    return history.filter((entry) => entry.type === filter);
  }, [history, filter]);

  if (!isAuthenticated) {
    return (
      <Screen className="pt-4">
        <Text variant="titleLg" className="mb-4">
          {t('records.title')}
        </Text>
        <GuestAccountCard />
      </Screen>
    );
  }

  if (historyLoading) {
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

      <UploadRecordsCard onPick={openUpload} />

      <Card elevated className="mb-4 overflow-hidden p-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('records.healthProfileTitle')}
          className="flex-row items-center gap-3 p-4 active:opacity-80"
          onPress={() => router.push(getPatientHealthProfileHref())}
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
            <Icon name="records" size={20} color="#0D9488" />
          </View>
          <View className="flex-1 gap-1">
            <Text variant="titleSm">{t('records.healthProfileTitle')}</Text>
            <Text variant="bodySm" muted>
              {t('records.subtitle')}
            </Text>
          </View>
          <Icon name={forwardIconName} size={20} color="#94A3B8" />
        </Pressable>
      </Card>

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
          actionLabel={t('records.upload.action')}
          onAction={() => openUpload('prescription')}
          icon={
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <Icon name="records" size={32} color="#0D9488" />
            </View>
          }
        />
      ) : (
        <MedicalRecordsList entries={filteredHistory} />
      )}
      <UploadMedicalDocumentSheet
        visible={uploadOpen}
        initialKind={uploadKind}
        onClose={() => setUploadOpen(false)}
      />
    </Screen>
  );
}
