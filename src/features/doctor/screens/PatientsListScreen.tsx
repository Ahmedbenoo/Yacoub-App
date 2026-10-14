import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PatientList } from '@/features/doctor/components/PatientList';
import { usePatientsQuery } from '@/features/patients/hooks/usePatientQueries';
import { Screen } from '@/shared/components/layout/Screen';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { getDoctorPatientHref } from '@/shared/navigation/routes';

export function PatientsListScreen() {
  const { t } = useTranslation('doctor');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = usePatientsQuery({ search });

  return (
    <Screen padded={false} className="flex-1 px-5 pt-3">
      <Text variant="titleMd" className="mb-3">
        {t('patients.title')}
      </Text>

      <Input
        containerClassName="mb-4"
        placeholder={t('patients.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

      <PatientList
        patients={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
        onRetry={() => refetch()}
        hrefForPatient={(patient) => getDoctorPatientHref(patient.id)}
      />
    </Screen>
  );
}
