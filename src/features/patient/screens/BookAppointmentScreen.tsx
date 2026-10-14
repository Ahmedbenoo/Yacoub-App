import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useBookAppointmentMutation } from '@/features/appointments/hooks/useAppointmentQueries';
import { BookingAuthCard } from '@/features/auth/components/BookingAuthCard';
import { BookingSlotPicker } from '@/features/patient/components/BookingSlotPicker';
import { useDoctorAvailabilityQuery, useDoctorDetailQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { formatDoctorTitle, formatSpecialty, generateBookingSlots } from '@/features/patient/lib/formatters';
import { bookingSchema, type BookingFormData } from '@/features/patient/schemas/booking.schemas';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore, useLocaleStore } from '@/shared/stores';

export function BookAppointmentScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation(['patient', 'common']);
  const locale = useLocaleStore((s) => s.locale);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: doctor, isLoading: doctorLoading, isError: doctorError, refetch } = useDoctorDetailQuery(id ?? '');
  const { data: availability, isLoading: availLoading } = useDoctorAvailabilityQuery(id ?? '');
  const bookMutation = useBookAppointmentMutation();

  const { control, handleSubmit, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { scheduledAt: '', reason: '', notes: '' },
  });

  if (doctorLoading || availLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (doctorError || !doctor || !availability) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('booking.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const slots = generateBookingSlots(availability.slots, locale, 60, {
    minutes: availability.slotMinutes,
    taken: availability.takenSlots,
  });

  const handleSelectSlot = (scheduledAt: string) => {
    setSelectedSlot(scheduledAt);
    setValue('scheduledAt', scheduledAt, { shouldValidate: true });
  };

  const onSubmit = handleSubmit((data) => {
    bookMutation.mutate(
      {
        doctorId: doctor.id,
        branchId: doctor.branchId,
        scheduledAt: data.scheduledAt,
        durationMinutes: availability.slotMinutes,
        reason: data.reason,
        notes: data.notes,
      },
      {
        onSuccess: () => router.replace('/(patient)/(tabs)/appointments' as never),
      },
    );
  });

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('booking.title')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-10">
        <Card className="items-center gap-3 border-primary-600 bg-primary-600 py-6">
          <Avatar
            firstName={doctor.firstName}
            lastName={doctor.lastName}
            size="xl"
            imageUrl={doctor.avatarUrl}
            className="h-24 w-24 border-2 border-white"
          />
          <View className="items-center gap-2">
            <Text variant="titleSm" className="text-center text-white">
              {formatDoctorTitle(doctor.firstName, doctor.lastName, t)}
            </Text>
            <Badge label={formatSpecialty(doctor.specialty, t)} className="bg-white" />
            <View className="flex-row items-center justify-center gap-1">
              <Icon name="location" size={14} color="#FFFFFF" />
              <Text variant="bodySm" className="text-center text-white/90">
                {doctor.branchName}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="gap-3">
          <Text variant="titleSm">{t('booking.selectSlot')}</Text>
          <BookingSlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={handleSelectSlot} />
        </Card>

        <Card className="gap-3">
          <FormInput control={control} name="reason" label={t('booking.reason')} />
          <FormInput control={control} name="notes" label={t('booking.notes')} />
        </Card>

        {isAuthenticated ? (
          <Button
            title={t('booking.confirm')}
            testID="booking-submit"
            onPress={onSubmit}
            loading={bookMutation.isPending}
            disabled={!selectedSlot}
            fullWidth
            size="lg"
          />
        ) : (
          <BookingAuthCard />
        )}
      </ScrollView>
    </Screen>
  );
}
