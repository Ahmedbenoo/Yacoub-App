import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AdminDoctorList } from '@/features/admin/components/AdminDoctorList';
import { useAdminDoctorsQuery } from '@/features/admin/hooks';
import { branchNameForClinic } from '@/features/admin/lib/branches';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { useUserClinicsQuery } from '@/features/clinic/hooks';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';
import { getAdminDoctorCreateHref, getAdminDoctorHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { DoctorProfile } from '@/shared/types/models/doctor';

function doctorMatchesClinic(doctor: DoctorProfile, clinicId: string) {
  const branchName = branchNameForClinic(clinicId);
  if (branchName) return doctor.branchName === branchName;
  return doctor.clinicId === clinicId;
}

export function AdminDoctorsScreen() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [clinicTab, setClinicTab] = useState('all');
  const { data: clinics, isLoading: clinicsLoading } = useUserClinicsQuery();
  const ownedClinicIds = (clinics ?? []).map((clinic) => clinic.id);

  const { data, isLoading, isError, refetch, isRefetching } = useAdminDoctorsQuery({
    search,
    includeInactive: showInactive,
    allClinics: true,
  });

  const doctors = (data?.data ?? []).filter((doctor) => {
    const belongsToOwner = ownedClinicIds.some((clinicId) => doctorMatchesClinic(doctor, clinicId));
    if (!belongsToOwner) return false;
    return clinicTab === 'all' || doctorMatchesClinic(doctor, clinicTab);
  });

  return (
    <Screen padded={false} className="flex-1 px-5 pt-4">
      <Row className="mb-4 items-center justify-between">
        <Text variant="titleLg">{t('doctors.title')}</Text>
        <Button
          title={t('doctors.createTitle')}
          variant="outline"
          size="sm"
          onPress={() => router.push(getAdminDoctorCreateHref(), { withAnchor: true })}
        />
      </Row>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {[
          { value: 'all', label: t('doctors.allClinics') },
          ...(clinics ?? []).map((clinic) => ({
            value: clinic.id,
            label: getClinicName(clinic, locale),
          })),
        ].map((option) => {
          const selected = option.value === clinicTab;
          return (
            <Pressable
              key={option.value}
              onPress={() => setClinicTab(option.value)}
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        containerClassName="mb-4"
        placeholder={t('doctors.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        leadingIcon={<Icon name="search" size={18} color="#94A3B8" />}
      />

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

      <AdminDoctorList
        doctors={doctors}
        isLoading={isLoading || clinicsLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
        onRetry={() => refetch()}
        hrefForDoctor={(doctor) => getAdminDoctorHref(doctor.id)}
      />
    </Screen>
  );
}
