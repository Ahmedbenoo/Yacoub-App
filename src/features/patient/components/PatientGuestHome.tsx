import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/features/patient/components/ClinicCard';
import { PatientPathChoices } from '@/features/patient/components/PatientPathChoices';
import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { useClinicsSearchQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { Row } from '@/shared/components/layout/Row';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientClinicHref, getPatientDoctorHref, getPatientSearchHref } from '@/shared/navigation/routes';

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

function HomeCardRail({ children }: { children: ReactNode }) {
  const [railWidth, setRailWidth] = useState(0);
  const tileWidth = railWidth > 0 ? Math.round((railWidth - 12) / 1.5) : 220;

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 pe-1"
      onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
    >
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ tileWidth?: number }>, { tileWidth })
          : child,
      )}
    </ScrollView>
  );
}

export function PatientGuestHome() {
  const { t } = useTranslation('patient');

  const doctorsQuery = useDoctorsQuery();
  const clinicsQuery = useClinicsSearchQuery();

  const doctors = (doctorsQuery.data?.data ?? []).filter((doctor) => doctor.isActive !== false).slice(0, 8);
  const clinics = (clinicsQuery.data?.data ?? []).slice(0, 8);

  return (
    <View className="gap-4 py-4">
      <Text variant="titleMd">{t('guest.heroTitle')}</Text>

      <PatientPathChoices isAuthenticated={false} />

      {(clinics.length > 0 || clinicsQuery.isFetching) && (
        <View className="gap-3">
          <SectionHeader
            title={t('guest.nearbyClinics')}
            actionLabel={t('guest.viewAll')}
            onAction={() => router.push(getPatientSearchHref({ tab: 'clinics' }))}
          />
          {clinics.length > 0 ? (
            <HomeCardRail>
              {clinics.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  variant="tile"
                  href={getPatientClinicHref(clinic.id)}
                />
              ))}
            </HomeCardRail>
          ) : (
            <SkeletonCard />
          )}
        </View>
      )}

      <View className="gap-3">
        <SectionHeader
          title={t('guest.featuredDoctors')}
          actionLabel={t('guest.viewAll')}
          onAction={() => router.push(getPatientSearchHref({ tab: 'doctors' }))}
        />
        {doctors.length > 0 ? (
          <HomeCardRail>
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                variant="tile"
                href={getPatientDoctorHref(doctor.id)}
              />
            ))}
          </HomeCardRail>
        ) : doctorsQuery.isFetching ? (
          <View className="gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null}
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
    </View>
  );
}
