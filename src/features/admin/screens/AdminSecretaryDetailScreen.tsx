import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAdminSecretaryQuery, useDeleteSecretaryMutation, useUpdateSecretaryMutation } from '@/features/admin/hooks';
import { getFullName } from '@/features/doctor/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ProfileHeroCard } from '@/shared/components/profile/ProfileHeroCard';
import { ProfileInfoRow } from '@/shared/components/profile/ProfileInfoRow';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { getAdminSecretaryEditHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

export function AdminSecretaryDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const locale = useLocaleStore((s) => s.locale);
  const { data: secretary, isLoading, isError, refetch } = useAdminSecretaryQuery(id);
  const updateSecretary = useUpdateSecretaryMutation();
  const deleteSecretary = useDeleteSecretaryMutation();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (isLoading && !secretary) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError && !secretary) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('staff.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  if (!secretary) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('staff.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const clinicName =
    locale === 'ar'
      ? secretary.clinicNameAr || secretary.clinicName
      : secretary.clinicName || secretary.clinicNameAr;
  const profileId = secretary.userId || secretary.id;

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={getFullName(secretary.firstName, secretary.lastName)} />

      <View className="gap-4 pb-10">
        <ProfileHeroCard
          firstName={secretary.firstName}
          lastName={secretary.lastName}
          avatarUrl={secretary.avatarUrl}
          title={getFullName(secretary.firstName, secretary.lastName)}
          subtitle={t('staff.roleSecretary')}
          badges={<Badge label={t('staff.roleSecretary')} variant="purple" />}
        />

        <Card className="gap-0 px-4 py-1">
          {secretary.phone ? (
            <ProfileInfoRow label={t('doctors.phone')} value={formatPhoneForDisplay(secretary.phone)} />
          ) : null}
          {clinicName ? <ProfileInfoRow label={t('clinic.name')} value={clinicName} /> : null}
        </Card>

        <Button
          title={t('doctors.changePhoto')}
          variant="outline"
          loading={updateSecretary.isPending}
          onPress={async () => {
            const avatarUrl = await pickProfileImage();
            if (!avatarUrl) return;
            updateSecretary.mutate({ id: profileId, payload: { avatarUrl } });
          }}
          fullWidth
        />
        <Button
          title={t('secretary.editTitle')}
          onPress={() => router.push(getAdminSecretaryEditHref(profileId))}
          fullWidth
        />
        <Button
          title={t('secretary.deleteTitle')}
          variant="danger"
          onPress={() => setConfirmVisible(true)}
          fullWidth
        />
        <ConfirmDialog
          visible={confirmVisible}
          title={t('secretary.deleteTitle')}
          message={t('secretary.deleteMessage', {
            name: getFullName(secretary.firstName, secretary.lastName),
          })}
          confirmLabel={t('secretary.deleteConfirm')}
          destructive
          loading={deleteSecretary.isPending}
          onConfirm={() => {
            deleteSecretary.mutate(profileId, {
              onSuccess: () => {
                setConfirmVisible(false);
                router.back();
              },
            });
          }}
          onCancel={() => setConfirmVisible(false)}
        />
      </View>
    </Screen>
  );
}
