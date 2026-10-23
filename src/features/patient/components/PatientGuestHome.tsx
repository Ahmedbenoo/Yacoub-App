import { View } from 'react-native';
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
import { Button } from '@/shared/components/ui/Button';
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

export function PatientGuestHome() {
  const { t } = useTranslation('patient');

  const doctorsQuery = useDoctorsQuery();
  const clinicsQuery = useClinicsSearchQuery();

  const doctors = (doctorsQuery.data?.data ?? []).filter((doctor) => doctor.isActive !== false).slice(0, 3);
  const clinics = (clinicsQuery.data?.data ?? []).slice(0, 2);

  return (
    <View className="gap-4 py-4">
      <Text variant="titleMd">{t('guest.heroTitle')}</Text>

      <Card elevated className="gap-2 p-3">
        <Text variant="titleSm">{t('guest.accountTitle')}</Text>
        <Text variant="bodySm" muted>
          {t('guest.accountDescription')}
        </Text>
        <Button
          title={t('guest.createAccount')}
          onPress={() => router.push('/(auth)/register')}
          fullWidth
          className="h-11 min-h-0"
        />
        <Button
          title={t('guest.signIn')}
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
          className="h-9 min-h-0"
        />
      </Card>

      <PatientPathChoices isAuthenticated={false} />

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
    </View>
  );
}
