import { Image, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoctorCard } from '@/features/patient/components/DoctorCard';
import {
  getClinicAddressLine,
  getClinicDescription,
  getClinicName,
  getClinicStreet,
} from '@/features/clinic/lib/formatters';
import { formatRating, formatSpecialty } from '@/features/patient/lib/formatters';
import { useClinicDetailQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { nativeLayoutMatchesLocale, useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientDoctorHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { Clinic } from '@/shared/types/models';

const HERO_HEIGHT = 280;

function coverUri(clinic: Clinic): string | undefined {
  return clinic.photoUrls?.[0] || clinic.logoUrl;
}

function openClinicMap(clinic: Clinic, locale: string) {
  const url = clinic.locationUrl?.trim();
  if (url) {
    void Linking.openURL(url);
    return;
  }
  const query = `${getClinicStreet(clinic, locale)} ${getClinicAddressLine(clinic, locale)}`;
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

function ActionChip({
  icon,
  label,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0F766E] py-4 active:opacity-90"
    >
      <Icon name={icon} size={18} color="#FFFFFF" />
      <Text variant="label" className="text-white">
        {label}
      </Text>
    </Pressable>
  );
}

function StatCell({ icon, label, value }: { icon: AppIconName; label: string; value: string }) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-[20px] bg-white px-4 dark:bg-slate-800"
      style={{ paddingVertical: 8 }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#CCFBF1] dark:bg-primary-900/40">
        <Icon name={icon} size={18} color="#0F766E" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="label">{value}</Text>
      </View>
    </View>
  );
}

export function ClinicProfileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const insets = useSafeAreaInsets();
  const { isRtl, backIconName } = useLayoutDirection();
  const backOnStartEdge = nativeLayoutMatchesLocale(isRtl) || !isRtl;

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
  const cover = coverUri(clinic);
  const extraPhotos = photos.slice(1);
  const description = getClinicDescription(clinic, locale);
  const ratingLabel = clinic.reviewCount
    ? formatRating(clinic.rating ?? 0, clinic.reviewCount)
    : clinic.rating
      ? clinic.rating.toFixed(1)
      : '—';
  const specialtyLabels = [
    ...(clinic.specialty ? [formatSpecialty(clinic.specialty, t)] : []),
    ...doctors.map((doctor) => formatSpecialty(doctor.specialty, t)),
  ].filter((label, index, all) => all.indexOf(label) === index);

  return (
    <Screen scroll padded={false}>
      <View style={{ height: HERO_HEIGHT, backgroundColor: '#0F766E', overflow: 'hidden' }}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: '100%', height: HERO_HEIGHT }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: cover ? 'rgba(2, 15, 14, 0.38)' : 'rgba(2, 15, 14, 0.12)',
          }}
        />
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(patient)/(tabs)/home' as never))}
          style={{
            position: 'absolute',
            top: Math.max(insets.top, 12),
            ...(backOnStartEdge ? { left: 16 } : { right: 16 }),
            height: 40,
            width: 40,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
          accessibilityRole="button"
          accessibilityLabel={tc('back')}
        >
          <Icon name={backIconName} size={18} color="#0F172A" />
        </Pressable>
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 20,
            gap: 8,
            zIndex: 1,
          }}
        >
          {specialtyLabels[0] ? (
            <View className="self-start rounded-full bg-white/20 px-3 py-1">
              <Text variant="caption" className="text-white">
                {specialtyLabels[0]}
              </Text>
            </View>
          ) : null}
          <Text variant="titleLg" className="text-white" numberOfLines={2}>
            {getClinicName(clinic, locale)}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-black/45 px-2.5 py-1">
              <Icon name="star" size={12} color="#FBBF24" />
              <Text variant="caption" className="text-white">
                {ratingLabel}
              </Text>
            </View>
            <View className="min-w-0 flex-1 flex-row items-center gap-1">
              <Icon name="location" size={14} color="#CCFBF1" />
              <Text variant="caption" className="text-white" numberOfLines={1} style={{ color: '#FFFFFF' }}>
                {getClinicAddressLine(clinic, locale)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="gap-4 px-5 py-5">
        <View className="flex-row gap-3">
          {clinic.phone ? (
            <ActionChip
              icon="phone"
              label={t('clinicProfile.call')}
              onPress={() => void Linking.openURL(`tel:${clinic.phone}`)}
            />
          ) : null}
          <ActionChip
            icon="location"
            label={t('clinicProfile.openMap')}
            onPress={() => openClinicMap(clinic, locale)}
          />
        </View>

        <View className="gap-2.5">
          {clinic.openingHours ? (
            <StatCell icon="clock" label={t('clinicProfile.hours')} value={clinic.openingHours} />
          ) : null}
          {clinic.consultationFee != null ? (
            <StatCell
              icon="clinic"
              label={t('clinicProfile.fee')}
              value={t('clinicProfile.feeValue', { value: clinic.consultationFee })}
            />
          ) : null}
          <StatCell icon="doctors" label={t('clinicProfile.doctors')} value={String(doctors.length)} />
        </View>

        {description ? (
          <Text variant="bodySm" muted>
            {description}
          </Text>
        ) : null}

        {specialtyLabels.length > 1 ? (
          <View className="gap-2">
            <Text variant="titleSm">{t('clinicProfile.specialties')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {specialtyLabels.map((label) => (
                <View key={label} className="rounded-full bg-primary-50 px-3.5 py-1.5 dark:bg-primary-900/30">
                  <Text variant="caption" className="text-primary-800 dark:text-primary-200">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {extraPhotos.length ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
          >
            {extraPhotos.map((photo, index) => (
              <Image
                key={`${index}-${photo.slice(0, 32)}`}
                source={{ uri: photo }}
                style={{ width: 168, height: 112, borderRadius: 18 }}
                accessibilityIgnoresInvertColors
              />
            ))}
          </ScrollView>
        ) : null}

        <Text variant="titleSm">{t('clinicProfile.doctors')}</Text>
        {doctorsLoading ? <Spinner /> : null}
        {doctorsError ? (
          <ErrorState message={t('search.error')} onRetry={() => refetchDoctors()} retryLabel={tc('retry')} />
        ) : null}
        <View className="gap-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} href={getPatientDoctorHref(doctor.id)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
