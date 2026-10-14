import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AdminPatientList } from '@/features/admin/components/AdminPatientList';
import { useAdminPatientsQuery } from '@/features/admin/hooks';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { getSecretaryPatientCreateHref, getSecretaryPatientHref } from '@/shared/navigation/routes';

export function SecretaryPatientsScreen() {
  const { t } = useTranslation(['secretary', 'common']);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useAdminPatientsQuery({ search });

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Row className="mb-4 items-center justify-between">
        <Text variant="titleLg">{t('patients.title')}</Text>
        <Button
          title={t('patients.add')}
          variant="outline"
          size="sm"
          onPress={() => router.push(getSecretaryPatientCreateHref(), { withAnchor: true })}
        />
      </Row>

      <Input
        containerClassName="mb-4"
        placeholder={t('patients.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

      <AdminPatientList
        patients={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
        onRetry={() => refetch()}
        hrefForPatient={(patient) => getSecretaryPatientHref(patient.id)}
      />
    </Screen>
  );
}
