import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/features/patient/components/ClinicCard';
import { DoctorCard } from '@/features/patient/components/DoctorCard';
import { HomeSpecialtyIcons } from '@/features/patient/components/HomeSpecialtyIcons';
import { useClinicsSearchQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import { useDoctorsQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { HOME_VISIT_CATALOG_DOCTORS, isHomeVisitDoctor } from '@/features/patient/lib/home-visit-doctors';
import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';
import { getPatientClinicHref, getPatientHomeVisitNewHref, getPatientSearchHref } from '@/shared/navigation/routes';

function isClinicDoctorSpecialty(specialty: string | undefined) {
  const id = specialty ? findClinicSpecialty(specialty)?.id : undefined;
  return id !== 'clinicalPathology' && id !== 'radiology';
}

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

export function PatientHomeCatalogRails() {
  const { t } = useTranslation('patient');
  const doctorsQuery = useDoctorsQuery({ limit: 50 });
  const clinicsQuery = useClinicsSearchQuery();

  const registeredHomeVisitDoctors = (doctorsQuery.data?.data ?? []).filter(isHomeVisitDoctor);
  const doctors = (
    registeredHomeVisitDoctors.length > 0
      ? registeredHomeVisitDoctors
      : doctorsQuery.isLoading
        ? []
        : HOME_VISIT_CATALOG_DOCTORS
  ).slice(0, 8);
  const clinics = (clinicsQuery.data?.data ?? [])
    .filter((clinic) => isClinicDoctorSpecialty(clinic.specialty))
    .slice(0, 8);

  return (
    <View className="gap-4">
      {(clinics.length > 0 || clinicsQuery.isFetching) && (
        <View className="gap-3">
          <SectionHeader
            title={t('guest.nearbyClinics')}
            actionLabel={t('guest.viewAll')}
            onAction={() => router.push(getPatientSearchHref({ tab: 'clinics' }))}
          />
          <HomeSpecialtyIcons />
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
                href={getPatientHomeVisitNewHref(doctor.specialty)}
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
    </View>
  );
}
