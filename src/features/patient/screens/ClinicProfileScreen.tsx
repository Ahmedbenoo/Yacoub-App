import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/features/patient/components/DoctorCard';
import {
  getClinicAddressLine,
  getClinicDescription,
  getClinicName,
  getClinicStreet,
} from '@/features/clinic/lib/formatters';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { useClinicDetailQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { getPatientDoctorHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { Clinic } from '@/shared/types/models';

function openClinicMap(clinic: Clinic, locale: string) {
  const url = clinic.locationUrl?.trim();
  if (url) {
    void Linking.openURL(url);
    return;
  }
  const query = `${getClinicStreet(clinic, locale)} ${getClinicAddressLine(clinic, locale)}`;
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

function ContactRow({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  if (!value.trim()) return null;

  return (
    <View className="gap-0.5">
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="body" style={ltr ? { writingDirection: 'ltr' } : undefined}>
        {ltr ? `\u2066${value}\u2069` : value}
      </Text>
    </View>
  );
}

export function ClinicProfileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const { rowStyle } = useLayoutDirection();
  const isDark = useResolvedColorScheme() === 'dark';

  const { data: clinic, isLoading, isError, refetch } = useClinicDetailQuery(id ?? '');
  const {
    data: doctorsData,
    isLoading: doctorsLoading,
    isError: doctorsError,
    refetch: refetchDoctors,
  } = useDoctorsQuery({ clinicId: id, allClinics: true });

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !clinic) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('clinicProfile.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  const doctors = doctorsData?.data ?? [];
  const photos = clinic.photoUrls ?? [];
  const specialtyLabels = [
    ...(clinic.specialty ? [formatSpecialty(clinic.specialty, t)] : []),
    ...doctors.map((doctor) => formatSpecialty(doctor.specialty, t)),
  ].filter((label, index, all) => all.indexOf(label) === index);

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack />

      <View className="gap-4 py-4">
        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            {clinic.logoUrl ? (
              <View className="h-[72px] w-[72px] overflow-hidden rounded-2xl">
                <Image
                  source={{ uri: clinic.logoUrl }}
                  style={{ width: 72, height: 72 }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
                <Icon name="clinic" size={28} color="#0D9488" />
              </View>
            )}
            <View className="min-w-0 flex-1 gap-1">
              <Text variant="titleLg">{getClinicName(clinic, locale)}</Text>
              <Text variant="bodySm" muted>
                {getClinicAddressLine(clinic, locale)}
              </Text>
            </View>
          </View>

          {getClinicDescription(clinic, locale) ? (
            <Text variant="body" muted>
              {getClinicDescription(clinic, locale)}
            </Text>
          ) : null}

          {photos.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {photos.map((photo, index) => (
                <Image
                  key={`${index}-${photo.slice(0, 32)}`}
                  source={{ uri: photo }}
                  style={{ width: 220, height: 132, borderRadius: 12 }}
                  accessibilityIgnoresInvertColors
                />
              ))}
            </ScrollView>
          ) : null}

          <View className="gap-2">
            <ContactRow label={t('clinicProfile.address')} value={getClinicStreet(clinic, locale)} />
            <Pressable onPress={() => openClinicMap(clinic, locale)} className="flex-row items-center gap-2" style={rowStyle}>
              <Icon name="location" size={18} color="#0D9488" />
              <Text variant="label" className="text-primary-700 dark:text-primary-300">
                {t('clinicProfile.openMap')}
              </Text>
            </Pressable>
          </View>

          <View className="gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            {specialtyLabels.length ? (
              <View className="gap-2">
                <Text variant="caption" muted>
                  {t('clinicProfile.specialties')}
                </Text>
                <View className="flex-row flex-wrap gap-3" style={rowStyle}>
                  {specialtyLabels.map((label) => (
                    <View key={label} className={`rounded-full px-4 py-2 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-800')}`}>
                      <Text variant="bodySm">{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {clinic.openingHours ? (
              <ContactRow label={t('clinicProfile.hours')} value={clinic.openingHours} />
            ) : null}
            {clinic.consultationFee != null ? (
              <ContactRow
                label={t('clinicProfile.fee')}
                value={t('clinicProfile.feeValue', { value: clinic.consultationFee })}
                ltr
              />
            ) : null}
            <Text variant="label">{t('clinicProfile.contact')}</Text>
            <ContactRow label={t('clinicProfile.phone')} value={clinic.phone} ltr />
            <ContactRow label={t('clinicProfile.email')} value={clinic.email} ltr />
          </View>
        </Card>

        <Text variant="titleSm">{t('clinicProfile.doctors')}</Text>
      </View>

      <View className="gap-3 pb-8">
        {doctorsLoading ? <Spinner /> : null}
        {doctorsError ? (
          <ErrorState message={t('search.error')} onRetry={() => refetchDoctors()} retryLabel={tc('retry')} />
        ) : null}
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} href={getPatientDoctorHref(doctor.id)} />
        ))}
      </View>
    </Screen>
  );
}
