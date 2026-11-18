import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicList } from '@/features/patient/components/ClinicList';
import { DoctorList } from '@/features/patient/components/DoctorList';
import { SpecialtyShortcuts } from '@/features/patient/components/SpecialtyShortcuts';
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
import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';
import { getPatientClinicHref, getPatientDoctorHref } from '@/shared/navigation/routes';
import type { Clinic } from '@/shared/types/models';
import type { DoctorProfile } from '@/shared/types/models/doctor';

type SearchMode = 'clinics' | 'doctors' | 'labs' | 'radiology';

const SEARCH_TABS: SearchMode[] = ['clinics', 'doctors', 'labs', 'radiology'];
const LABS_SPECIALTY = 'Clinical Pathology';
const RADIOLOGY_SPECIALTY = 'Radiology';

function isSearchMode(value: string | undefined): value is SearchMode {
  return value === 'clinics' || value === 'doctors' || value === 'labs' || value === 'radiology';
}

function specialtyMatches(value: string | undefined, selected: string) {
  if (!value) return false;
  if (value === selected) return true;
  const left = findClinicSpecialty(value);
  const right = findClinicSpecialty(selected);
  return Boolean(left && right && left.id === right.id);
}

function clinicOffersSpecialty(clinic: Clinic, specialty: string, doctors: DoctorProfile[]) {
  if (specialtyMatches(clinic.specialty, specialty)) return true;

  const branchName = branchNameForClinic(clinic.id);
  return doctors.some((doctor) => {
    if (doctor.isActive === false || !specialtyMatches(doctor.specialty, specialty)) return false;
    if (branchName) return doctor.branchName === branchName;
    return doctor.clinicId === clinic.id;
  });
}

function parseSearchMode(tab?: string, specialty?: string): SearchMode {
  if (isSearchMode(tab)) return tab;
  const specId = specialty ? findClinicSpecialty(specialty)?.id : undefined;
  if (specId === 'clinicalPathology') return 'labs';
  if (specId === 'radiology') return 'radiology';
  return 'clinics';
}

export function DoctorSearchScreen() {
  const { t } = useTranslation('patient');
  const isDark = useResolvedColorScheme() === 'dark';
  const params = useLocalSearchParams<{ specialty?: string | string[]; tab?: string | string[] }>();
  const specialtyParam = Array.isArray(params.specialty) ? params.specialty[0] : params.specialty;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  const [mode, setMode] = useState<SearchMode>(() => parseSearchMode(tabParam, specialtyParam));
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | undefined>(specialtyParam);

  useEffect(() => {
    setMode(parseSearchMode(tabParam, specialtyParam));
    if (specialtyParam) {
      setSpecialty(specialtyParam);
    }
  }, [specialtyParam, tabParam]);

  const catalogSpecialties = useDoctorSpecialties();
  const specialties = useMemo(() => {
    const resolved = specialty ? findClinicSpecialty(specialty)?.nameEn ?? specialty : undefined;
    if (!resolved || catalogSpecialties.includes(resolved) || catalogSpecialties.includes(specialty ?? '')) {
      return catalogSpecialties;
    }
    return [resolved, ...catalogSpecialties];
  }, [catalogSpecialties, specialty]);
  const clinicsQuery = useClinicsSearchQuery({ search });
  const doctorsQuery = useDoctorsQuery({
    search: mode === 'doctors' ? search : undefined,
    specialty: mode === 'doctors' ? specialty : undefined,
  });
  const facilitySpecialty =
    mode === 'labs' ? LABS_SPECIALTY : mode === 'radiology' ? RADIOLOGY_SPECIALTY : undefined;
  const needsDoctorsForClinics = Boolean(facilitySpecialty || (mode === 'clinics' && specialty));
  const clinics = useMemo(() => {
    const all = clinicsQuery.data?.data ?? [];
    const doctors = doctorsQuery.data?.data ?? [];
    if (facilitySpecialty) {
      return all.filter((clinic) => clinicOffersSpecialty(clinic, facilitySpecialty, doctors));
    }
    if (mode !== 'clinics') return all;
    return all.filter((clinic) => {
      if (specialtyMatches(clinic.specialty, LABS_SPECIALTY)) return false;
      if (specialtyMatches(clinic.specialty, RADIOLOGY_SPECIALTY)) return false;
      if (specialty && !clinicOffersSpecialty(clinic, specialty, doctors)) return false;
      return true;
    });
  }, [clinicsQuery.data?.data, doctorsQuery.data?.data, facilitySpecialty, mode, specialty]);

  const placeholder =
    mode === 'doctors'
      ? t('search.placeholder')
      : mode === 'labs'
        ? t('clinicSearch.labsPlaceholder')
        : mode === 'radiology'
          ? t('clinicSearch.radiologyPlaceholder')
          : t('clinicSearch.placeholder');

  const showSpecialties = mode === 'clinics' || mode === 'doctors';

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Text variant="titleLg" className="mb-4">
        {t('searchHub.title')}
      </Text>

      <Row className="mb-4 gap-1.5">
        {SEARCH_TABS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setMode(option)}
            className={cn(
              'min-w-0 flex-1 items-center justify-center rounded-2xl px-1 py-2.5',
              mode === option ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800'),
            )}
          >
            <Text
              variant="caption"
              className={cn('text-center font-semibold', mode === option ? 'text-white' : undefined)}
              numberOfLines={1}
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

      {showSpecialties ? (
        <SpecialtyShortcuts specialties={specialties} selected={specialty} onSelect={setSpecialty} />
      ) : null}

      <View className="flex-1">
        {mode === 'doctors' ? (
          <DoctorList
            doctors={doctorsQuery.data?.data ?? []}
            specialties={specialties}
            selectedSpecialty={specialty}
            isLoading={doctorsQuery.isLoading}
            isError={doctorsQuery.isError}
            isRefetching={doctorsQuery.isRefetching}
            onRefresh={() => doctorsQuery.refetch()}
            onRetry={() => doctorsQuery.refetch()}
            hrefForDoctor={(doctor) => getPatientDoctorHref(doctor.id)}
          />
        ) : (
          <ClinicList
            clinics={clinics}
            isLoading={clinicsQuery.isLoading || (needsDoctorsForClinics && doctorsQuery.isLoading)}
            isError={clinicsQuery.isError}
            isRefetching={clinicsQuery.isRefetching}
            onRefresh={() => clinicsQuery.refetch()}
            onRetry={() => clinicsQuery.refetch()}
            hrefForClinic={(clinic) => getPatientClinicHref(clinic.id)}
            emptyTitle={
              mode === 'labs'
                ? t('clinicSearch.empty.labsTitle')
                : mode === 'radiology'
                  ? t('clinicSearch.empty.radiologyTitle')
                  : undefined
            }
            emptyDescription={
              mode === 'labs'
                ? t('clinicSearch.empty.labsDescription')
                : mode === 'radiology'
                  ? t('clinicSearch.empty.radiologyDescription')
                  : undefined
            }
          />
        )}
      </View>
    </Screen>
  );
}
