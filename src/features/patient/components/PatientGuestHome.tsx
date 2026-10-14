import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/features/patient/components/ClinicCard';
import { PatientPathChoices } from '@/features/patient/components/PatientPathChoices';
import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { useClinicsSearchQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery, useDoctorSpecialties } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { SpecialtyGlyph } from '@/features/patient/lib/specialty-icons';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { Row } from '@/shared/components/layout/Row';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientClinicHref, getPatientDoctorHref, getPatientSearchHref } from '@/shared/navigation/routes';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';

const SPECIALTY_TAB_GAP = 10;

const BENEFITS: { icon: AppIconName; titleKey: string; descriptionKey: string }[] = [
  {
    icon: 'calendar',
    titleKey: 'guest.whyBookingTitle',
    descriptionKey: 'guest.whyBookingDescription',
  },
  {
    icon: 'doctors',
    titleKey: 'guest.whyDoctorsTitle',
    descriptionKey: 'guest.whyDoctorsDescription',
  },
  {
    icon: 'records',
    titleKey: 'guest.whyRecordsTitle',
    descriptionKey: 'guest.whyRecordsDescription',
  },
];

export function PatientGuestHome() {
  const { t } = useTranslation('patient');
  const { rowStyle, isRtl } = useLayoutDirection();
  const isDark = useResolvedColorScheme() === 'dark';
  const specialtyScrollRef = useRef<ScrollView>(null);
  const [specialtyViewportWidth, setSpecialtyViewportWidth] = useState(0);

  const specialties = useDoctorSpecialties();
  const doctorsQuery = useDoctorsQuery();
  const clinicsQuery = useClinicsSearchQuery();

  useEffect(() => {
    if (!isRtl || specialtyViewportWidth <= 0) return;
    specialtyScrollRef.current?.scrollToEnd({ animated: false });
  }, [isRtl, specialtyViewportWidth, specialties.length]);

  const doctors = (doctorsQuery.data?.data ?? []).filter((doctor) => doctor.isActive !== false).slice(0, 3);
  const clinics = (clinicsQuery.data?.data ?? []).slice(0, 2);

  return (
    <View className="gap-4 py-4">
      <View className="gap-1">
        <Text variant="titleMd">{t('guest.heroTitle')}</Text>
        <Text variant="bodySm" muted>
          {t('guest.heroSubtitle')}
        </Text>
      </View>

      <PatientPathChoices isAuthenticated={false} />

      {specialties.length > 0 && (
        <View className="gap-2">
          <Text variant="body" className="font-semibold">
            {t('guest.specialtiesTitle')}
          </Text>
          <ScrollView
            ref={specialtyScrollRef}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            onLayout={(event) => setSpecialtyViewportWidth(event.nativeEvent.layout.width)}
            onContentSizeChange={(contentWidth) => {
              if (!isRtl) return;
              specialtyScrollRef.current?.scrollTo({
                x: Math.max(0, contentWidth - specialtyViewportWidth),
                animated: false,
              });
            }}
            contentContainerStyle={{
              flexDirection: isRtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: SPECIALTY_TAB_GAP,
            }}
          >
            {specialties.map((specialty) => (
              <Pressable
                key={specialty}
                accessibilityRole="button"
                onPress={() => router.push(getPatientSearchHref({ specialty, tab: 'clinics' }))}
                style={[
                  rowStyle,
                  {
                    flexShrink: 0,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  },
                ]}
                className={`shrink-0 items-center justify-center gap-1.5 rounded-full active:opacity-80 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-800')}`}
              >
                <SpecialtyGlyph specialty={specialty} color={isDark ? '#5EEAD4' : '#0D9488'} />
                <Text variant="label">
                  {formatSpecialty(specialty, t)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {(clinicsQuery.isLoading || clinics.length > 0) && (
        <View className="gap-3">
          <SectionHeader
            title={t('guest.nearbyClinics')}
            actionLabel={t('guest.viewAll')}
            onAction={() => router.push(getPatientSearchHref({ tab: 'clinics' }))}
          />
          {clinicsQuery.isLoading ? (
            <SkeletonCard />
          ) : (
            clinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} href={getPatientClinicHref(clinic.id)} />
            ))
          )}
        </View>
      )}

      <View className="gap-3">
        <SectionHeader
          title={t('guest.featuredDoctors')}
          actionLabel={t('guest.viewAll')}
          onAction={() => router.push(getPatientSearchHref({ tab: 'doctors' }))}
        />
        {doctorsQuery.isLoading ? (
          <View className="gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} href={getPatientDoctorHref(doctor.id)} />
          ))
        )}
      </View>

      <Card elevated className="gap-4">
        <Text variant="titleSm">{t('guest.whyTitle')}</Text>
        {BENEFITS.map((benefit) => (
          <Row key={benefit.titleKey} className="items-start gap-3">
            <View className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
              <Icon name={benefit.icon} size={20} color="#0D9488" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="label">{t(benefit.titleKey)}</Text>
              <Text variant="bodySm" muted>
                {t(benefit.descriptionKey)}
              </Text>
            </View>
          </Row>
        ))}
      </Card>

      <Card elevated className="gap-3">
        <Text variant="titleSm">{t('guest.accountTitle')}</Text>
        <Text variant="bodySm" muted>
          {t('guest.accountDescription')}
        </Text>
        <Button title={t('guest.createAccount')} onPress={() => router.push('/(auth)/register')} fullWidth />
        <Button
          title={t('guest.signIn')}
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
        />
      </Card>
    </View>
  );
}
