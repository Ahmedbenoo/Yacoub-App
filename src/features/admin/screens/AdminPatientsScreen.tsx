import { useState } from 'react';
import { Pressable } from 'react-native';
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
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { getAdminPatientCreateHref, getAdminPatientHref } from '@/shared/navigation/routes';

export function AdminPatientsScreen() {
  const { t } = useTranslation(['admin', 'common']);
  const isDark = useResolvedColorScheme() === 'dark';
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useAdminPatientsQuery({
    search,
    includeInactive: showInactive,
  });

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Row className="mb-4 items-center justify-between">
        <Text variant="titleLg">{t('patients.title')}</Text>
        <Button
          title={t('common:add')}
          variant="outline"
          size="sm"
          onPress={() => router.push(getAdminPatientCreateHref(), { withAnchor: true })}
        />
      </Row>

      <Input
        containerClassName="mb-4"
        placeholder={t('patients.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

      <Row className="mb-4">
        <Pressable
          onPress={() => setShowInactive((value) => !value)}
          testID="admin-patients-show-inactive"
          className={cn(
            'rounded-full px-3 py-2',
            showInactive ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700'),
          )}
        >
          <Text variant="caption" className={cn(showInactive ? 'text-white' : undefined)}>
            {t('patients.showInactive')}
          </Text>
        </Pressable>
      </Row>

      <AdminPatientList
        patients={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
        onRetry={() => refetch()}
        hrefForPatient={(patient) => getAdminPatientHref(patient.id)}
      />
    </Screen>
  );
}
