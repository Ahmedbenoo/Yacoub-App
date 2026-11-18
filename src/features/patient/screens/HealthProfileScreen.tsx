import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UploadMedicalDocumentSheet } from '@/features/patient/components/UploadMedicalDocumentSheet';
import { UploadRecordsCard } from '@/features/patient/components/UploadRecordsCard';
import {
  emptyHealthProfileForm,
  HealthProfileFields,
  healthProfileFromForm,
  healthProfileToForm,
  type HealthProfileFormValues,
} from '@/features/patients/components/HealthProfileFields';
import {
  useMyPatientProfileQuery,
  useUpdateMyHealthProfileMutation,
} from '@/features/patients/hooks/usePatientRecordsQueries';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { GuestPrompt } from '@/shared/components/feedback/GuestPrompt';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import type { MedicalDocumentKind } from '@/shared/types/models/patient';

export function HealthProfileScreen() {
  const { t } = useTranslation('patient');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isLoading, isError, refetch } = useMyPatientProfileQuery();
  const updateHealth = useUpdateMyHealthProfileMutation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadKind, setUploadKind] = useState<MedicalDocumentKind>('prescription');
  const form = useForm<HealthProfileFormValues>({
    defaultValues: emptyHealthProfileForm,
  });

  useEffect(() => {
    if (!profile) return;
    form.reset(healthProfileToForm(profile));
  }, [profile, form]);

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
      <UploadRecordsCard
        onPick={(kind) => {
          setUploadKind(kind);
          setUploadOpen(true);
        }}
      />
      <Card className="mb-4 gap-3">
        <Text variant="bodySm" muted>
          {t('profile.healthHint')}
        </Text>
        <HealthProfileFields control={form.control} />
        <Button
          title={t('profile.save')}
          onPress={form.handleSubmit((values) => updateHealth.mutate(healthProfileFromForm(values)))}
          loading={updateHealth.isPending}
          fullWidth
        />
      </Card>
      <UploadMedicalDocumentSheet
        visible={uploadOpen}
        initialKind={uploadKind}
        onClose={() => setUploadOpen(false)}
      />
    </Screen>
  );
}
