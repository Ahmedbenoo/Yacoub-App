import { useTranslation } from 'react-i18next';

import { useMyPatientProfileQuery } from '@/features/patients/hooks/usePatientRecordsQueries';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { GuestPrompt } from '@/shared/components/feedback/GuestPrompt';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ProfileInfoRow } from '@/shared/components/profile/ProfileInfoRow';
import { Card } from '@/shared/components/ui/Card';
import { useAuthStore } from '@/shared/stores';

export function HealthProfileScreen() {
  const { t } = useTranslation('patient');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isLoading, isError, refetch } = useMyPatientProfileQuery();

  if (!isAuthenticated) {
    return (
      <Screen>
        <Header showBack title={t('records.subtitle')} />
        <GuestPrompt title={t('guest.recordsTitle')} description={t('guest.recordsDescription')} />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <Header showBack title={t('records.subtitle')} />
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen>
        <Header showBack title={t('records.subtitle')} />
        <ErrorState message={t('records.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header showBack title={t('records.subtitle')} />
      <Card className="mb-4 gap-0 px-4 py-1">
        <ProfileInfoRow label={t('profile.bloodType')} value={profile.bloodType || t('profile.none')} />
        <ProfileInfoRow
          label={t('profile.allergies')}
          value={profile.allergies.length ? profile.allergies.join(', ') : t('profile.none')}
        />
        <ProfileInfoRow
          label={t('profile.conditions')}
          value={
            profile.chronicConditions.length ? profile.chronicConditions.join(', ') : t('profile.none')
          }
        />
      </Card>
    </Screen>
  );
}
