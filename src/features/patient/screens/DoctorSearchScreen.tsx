import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicList } from '@/features/patient/components/ClinicList';
import { DoctorList } from '@/features/patient/components/DoctorList';
import { useClinicsSearchQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery, useDoctorSpecialties } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { branchNameForClinic } from '@/shared/lib/clinic-branches';
import { getPatientClinicHref, getPatientDoctorHref } from '@/shared/navigation/routes';
import type { Clinic } from '@/shared/types/models';
import type { DoctorProfile } from '@/shared/types/models/doctor';

type SearchMode = 'clinics' | 'doctors';

function clinicOffersSpecialty(clinic: Clinic, specialty: string, doctors: DoctorProfile[]) {
  if (clinic.specialty === specialty) return true;

  const branchName = branchNameForClinic(clinic.id);
  return doctors.some((doctor) => {
    if (doctor.isActive === false || doctor.specialty !== specialty) return false;
    if (branchName) return doctor.branchName === branchName;
    return doctor.clinicId === clinic.id;
  });
}

export function DoctorSearchScreen() {
  const { t } = useTranslation('patient');
  const isDark = useResolvedColorScheme() === 'dark';
  const params = useLocalSearchParams<{ specialty?: string | string[]; tab?: string | string[] }>();
  const specialtyParam = Array.isArray(params.specialty) ? params.specialty[0] : params.specialty;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  const [mode, setMode] = useState<SearchMode>(tabParam === 'doctors' ? 'doctors' : 'clinics');
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | undefined>(specialtyParam);

  useEffect(() => {
    if (tabParam === 'clinics' || tabParam === 'doctors') {
      setMode(tabParam);
    }
    if (specialtyParam) {
      setSpecialty(specialtyParam);
      setMode(tabParam === 'doctors' ? 'doctors' : 'clinics');
    }
  }, [specialtyParam, tabParam]);

  const specialties = useDoctorSpecialties();
  const clinicsQuery = useClinicsSearchQuery({ search });
  const doctorsQuery = useDoctorsQuery({
    search: mode === 'clinics' ? undefined : search,
    specialty,
  });
  const filteringClinics = mode === 'clinics' && Boolean(specialty);
  const clinics = useMemo(() => {
    const all = clinicsQuery.data?.data ?? [];
    if (!filteringClinics || !specialty) return all;
    return all.filter((clinic) => clinicOffersSpecialty(clinic, specialty, doctorsQuery.data?.data ?? []));
  }, [clinicsQuery.data?.data, doctorsQuery.data?.data, filteringClinics, specialty]);

  const placeholder =
    mode === 'clinics' ? t('clinicSearch.placeholder') : t('search.placeholder');

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Text variant="titleLg" className="mb-4">
        {t('searchHub.title')}
      </Text>

      <Row className="mb-4 gap-2">
        {(['clinics', 'doctors'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setMode(option)}
            className={cn(
              'flex-1 items-center justify-center rounded-xl py-3',
              mode === option ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800'),
            )}
          >
            <Text
              variant="label"
              className={cn('text-center', mode === option ? 'text-white' : undefined)}
            >
              {t(`searchHub.${option}`)}
            </Text>
          </Pressable>
        ))}
      </Row>

      <Input
        containerClassName="mb-4"
        placeholder={placeholder}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

      <View className="flex-1">
        {mode === 'clinics' ? (
          <ClinicList
            clinics={clinics}
            isLoading={clinicsQuery.isLoading || (filteringClinics && doctorsQuery.isLoading)}
            isError={clinicsQuery.isError}
            isRefetching={clinicsQuery.isRefetching}
            onRefresh={() => clinicsQuery.refetch()}
            onRetry={() => clinicsQuery.refetch()}
            hrefForClinic={(clinic) => getPatientClinicHref(clinic.id)}
          />
        ) : (
          <DoctorList
            doctors={doctorsQuery.data?.data ?? []}
            specialties={specialties}
            selectedSpecialty={specialty}
            onSelectSpecialty={setSpecialty}
            isLoading={doctorsQuery.isLoading}
            isError={doctorsQuery.isError}
            isRefetching={doctorsQuery.isRefetching}
            onRefresh={() => doctorsQuery.refetch()}
            onRetry={() => doctorsQuery.refetch()}
            hrefForDoctor={(doctor) => getPatientDoctorHref(doctor.id)}
          />
        )}
      </View>
    </Screen>
  );
}
