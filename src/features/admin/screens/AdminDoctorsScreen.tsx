import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AddStaffRoleMenu } from '@/features/admin/components/AddStaffRoleMenu';
import { AdminDoctorList } from '@/features/admin/components/AdminDoctorList';
import { useAdminDoctorsQuery, useAdminSecretariesQuery } from '@/features/admin/hooks';
import { branchNameForClinic } from '@/features/admin/lib/branches';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { useUserClinicsQuery } from '@/features/clinic/hooks';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { getAdminDoctorHref, getAdminSecretaryHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { DoctorProfile } from '@/shared/types/models/doctor';

function doctorMatchesClinic(doctor: DoctorProfile, clinicId: string) {
  const branchName = branchNameForClinic(clinicId);
  if (branchName) return doctor.branchName === branchName;
  return doctor.clinicId === clinicId;
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full px-3 py-2',
        selected ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700'),
      )}
    >
      <Text
        variant="caption"
        numberOfLines={1}
        className={cn(selected ? 'text-white' : undefined)}
        style={{ alignSelf: 'auto' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AdminDoctorsScreen() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [clinicTab, setClinicTab] = useState('all');
  const [roleTab, setRoleTab] = useState<'all' | 'doctors' | 'secretaries'>('all');
  const { data: clinics, isLoading: clinicsLoading } = useUserClinicsQuery();
  const ownedClinicIds = (clinics ?? []).map((clinic) => clinic.id);
  const showClinicFilters = (clinics ?? []).length > 1;

  const doctorsQuery = useAdminDoctorsQuery({
    search,
    includeInactive: showInactive,
    allClinics: true,
  });
  const secretariesQuery = useAdminSecretariesQuery();

  const doctors = (doctorsQuery.data?.data ?? []).filter((doctor) => {
    if (roleTab === 'secretaries') return false;
    const belongsToOwner = ownedClinicIds.some((clinicId) => doctorMatchesClinic(doctor, clinicId));
    if (!belongsToOwner) return false;
    return clinicTab === 'all' || doctorMatchesClinic(doctor, clinicTab);
  });

  const query = search.trim().toLowerCase();
  const secretaries = (secretariesQuery.data ?? []).filter((secretary) => {
    if (roleTab === 'doctors') return false;
    if (clinicTab !== 'all' && secretary.clinicId && secretary.clinicId !== clinicTab) return false;
    if (!query) return true;
    return `${secretary.firstName} ${secretary.lastName} ${secretary.phone}`.toLowerCase().includes(query);
  });

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Row className="mb-4 items-center justify-between gap-3">
        <Text variant="titleLg" className="min-w-0 shrink">
          {t('staff.title')}
        </Text>
        <AddStaffRoleMenu />
      </Row>

      {showClinicFilters ? (
        <View className="mb-3 flex-row flex-wrap gap-2">
          <FilterChip
            label={t('doctors.allClinics')}
            selected={clinicTab === 'all'}
            onPress={() => setClinicTab('all')}
          />
          {(clinics ?? []).map((clinic) => (
            <FilterChip
              key={clinic.id}
              label={getClinicName(clinic, locale)}
              selected={clinicTab === clinic.id}
              onPress={() => setClinicTab(clinic.id)}
            />
          ))}
        </View>
      ) : null}

      <View className="mb-3 flex-row flex-wrap gap-2">
        <FilterChip
          label={t('doctors.allClinics')}
          selected={roleTab === 'all'}
          onPress={() => setRoleTab('all')}
        />
        <FilterChip
          label={t('staff.doctors')}
          selected={roleTab === 'doctors'}
          onPress={() => setRoleTab('doctors')}
        />
        <FilterChip
          label={t('staff.secretaries')}
          selected={roleTab === 'secretaries'}
          onPress={() => setRoleTab('secretaries')}
        />
      </View>

      <Input
        containerClassName="mb-3"
        placeholder={t('staff.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

      {roleTab !== 'secretaries' ? (
        <Row className="mb-4">
          <Pressable
            onPress={() => setShowInactive((value) => !value)}
            testID="admin-doctors-show-inactive"
            className={cn(
              'rounded-full px-3 py-2',
              showInactive ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700'),
            )}
          >
            <Text variant="caption" className={cn(showInactive ? 'text-white' : undefined)}>
              {t('doctors.showInactive')}
            </Text>
          </Pressable>
        </Row>
      ) : (
        <View className="mb-4" />
      )}

      <AdminDoctorList
        doctors={doctors}
        secretaries={secretaries}
        isLoading={doctorsQuery.isLoading || clinicsLoading}
        isError={doctorsQuery.isError}
        isRefetching={doctorsQuery.isRefetching || secretariesQuery.isRefetching}
        onRefresh={() => {
          void doctorsQuery.refetch();
          void secretariesQuery.refetch();
        }}
        onRetry={() => {
          void doctorsQuery.refetch();
        }}
        hrefForDoctor={(doctor) => getAdminDoctorHref(doctor.id)}
        hrefForSecretary={(secretary) => getAdminSecretaryHref(secretary.userId || secretary.id)}
      />
    </Screen>
  );
}
