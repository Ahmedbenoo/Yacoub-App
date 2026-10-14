import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAdminDoctorsQuery } from '@/features/admin/hooks/useAdminStaffQueries';
import { useBookAppointmentMutation } from '@/features/appointments/hooks/useAppointmentQueries';
import { useDoctorAvailabilityQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { BookingSlotPicker } from '@/features/patient/components/BookingSlotPicker';
import { usePatientDetailQuery } from '@/features/patients/hooks/usePatientQueries';
import { generateBookingSlots } from '@/features/patient/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { DoctorProfile } from '@/shared/types/models/doctor';

export function SecretaryBookScreen() {
  const patientId = useRouteIdParam();
  const { t } = useTranslation('secretary');
  const { t: tp } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const patientQuery = usePatientDetailQuery(patientId);
  const doctorsQuery = useAdminDoctorsQuery();
  const doctors = doctorsQuery.data?.data ?? [];
  const onlyDoctorId = doctors.length === 1 ? doctors[0]?.id : undefined;
  const availabilityQuery = useDoctorAvailabilityQuery(doctor?.id ?? '');
  const bookMutation = useBookAppointmentMutation();

  useEffect(() => {
    if (!onlyDoctorId) return;
    const onlyDoctor = doctors.find((item) => item.id === onlyDoctorId);
    if (!onlyDoctor) return;
    setDoctor((current) => (current?.id === onlyDoctor.id ? current : onlyDoctor));
  }, [doctors, onlyDoctorId]);

  if (patientQuery.isLoading || doctorsQuery.isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('book.error')} onRetry={() => patientQuery.refetch()} />
      </Screen>
    );
  }

  const patient = patientQuery.data;
  const slots = availabilityQuery.data
    ? generateBookingSlots(availabilityQuery.data.slots, locale, 60, {
        minutes: availabilityQuery.data.slotMinutes,
        taken: availabilityQuery.data.takenSlots,
      })
    : [];

  const bookDesk = (scheduledAt: string) => {
    if (!doctor) return;
    bookMutation.mutate(
      {
        doctorId: doctor.id,
        branchId: doctor.branchId,
        scheduledAt,
        durationMinutes: availabilityQuery.data?.slotMinutes,
        reason: t('book.frontDeskReason'),
        patientId: patient.id,
        desk: true,
      },
      {
        onSuccess: () => router.replace('/(secretary)/(tabs)/appointments' as never),
      },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('book.title')} />

      <View className="gap-4 pb-10">
        <Card className="gap-1">
          <Text variant="label" muted>
            {t('book.patient')}
          </Text>
          <Text variant="titleSm">
            {patient.firstName} {patient.lastName}
          </Text>
          {patient.phone ? (
            <Text variant="bodySm" muted>
              {patient.phone}
            </Text>
          ) : null}
        </Card>

        <Card className="gap-3">
          <Text variant="titleSm">{t('book.selectDoctor')}</Text>
          {doctors.length === 0 ? (
            <Text variant="bodySm" muted>
              {t('book.noDoctors')}
            </Text>
          ) : null}
          {doctors.map((item) => {
            const selected = doctor?.id === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setDoctor(item);
                  setSelectedSlot(null);
                }}
                className={`rounded-xl px-3 py-3 ${selected ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')}`}
              >
                <Text variant="bodySm" className={selected ? 'text-white' : undefined}>
                  {tp('search.doctorTitle', { name: `${item.firstName} ${item.lastName}`.trim() })}
                </Text>
                <Text variant="caption" className={selected ? 'text-white/80' : undefined}>
                  {item.branchName}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        {doctor ? (
          <Card className="gap-3">
            <Text variant="titleSm">{tp('booking.selectSlot')}</Text>
            {availabilityQuery.isLoading ? <Spinner /> : null}
            <BookingSlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
          </Card>
        ) : null}

        {doctors.length > 0 ? (
          <View className="gap-3">
            <Button
              title={t('book.turn')}
              onPress={() => slots[0] && bookDesk(slots[0].scheduledAt)}
              loading={bookMutation.isPending}
              disabled={!doctor || slots.length === 0}
              fullWidth
              size="lg"
            />
            <Button
              title={t('book.confirm')}
              variant="outline"
              onPress={() => selectedSlot && bookDesk(selectedSlot)}
              loading={bookMutation.isPending}
              disabled={!doctor || !selectedSlot}
              fullWidth
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
