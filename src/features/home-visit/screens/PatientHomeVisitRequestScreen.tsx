import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useCreateHomeVisitMutation } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { homeVisitRequestSchema, type HomeVisitRequestForm } from '@/features/home-visit/schemas/home-visit.schemas';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { CLINIC_SPECIALTIES, HOME_VISIT_SPECIALTY_IDS } from '@/shared/catalog/clinic-specialties';
import { DateCalendarField } from '@/shared/components/form/DateCalendarField';
import { FormInput } from '@/shared/components/form/FormInput';
import { TimePickerField } from '@/shared/components/form/TimePickerField';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { formatLocationAddress, getCurrentCoordinates } from '@/shared/lib/current-location';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';

const HOME_VISIT_SPECIALTIES = HOME_VISIT_SPECIALTY_IDS.map((id) =>
  CLINIC_SPECIALTIES.find((specialty) => specialty.id === id),
).filter((specialty): specialty is NonNullable<typeof specialty> => Boolean(specialty));

export function PatientHomeVisitRequestScreen() {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');
  const { t: tv } = useTranslation('validation');
  const { rowStyle } = useLayoutDirection();
  const user = useAuthStore((s) => s.user);
  const createRequest = useCreateHomeVisitMutation();
  const [locating, setLocating] = useState(false);
  const { control, handleSubmit, watch, setValue, formState } = useForm<HomeVisitRequestForm>({
    resolver: zodResolver(homeVisitRequestSchema),
    defaultValues: { specialty: '', address: '', date: '', time: '', notes: '' },
  });
  const selectedSpecialty = watch('specialty');

  const fillCurrentLocation = async () => {
    setLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      setValue('address', formatLocationAddress(coords.latitude, coords.longitude, t('currentLocationLabel')), {
        shouldValidate: true,
      });
    } catch {
      Toast.show({ type: 'error', text1: t('locationFailed') });
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = (data: HomeVisitRequestForm) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    createRequest.mutate(
      {
        patientUserId: user.id,
        patientName: `${user.firstName} ${user.lastName}`.trim(),
        patientPhone: user.phone,
        specialty: data.specialty,
        address: data.address,
        scheduledAt: `${data.date} ${data.time}`,
        notes: data.notes,
      },
      { onSuccess: () => router.replace('/(patient)/home-visit' as never) },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('requestTitle')} />
      <View className="gap-5 py-4">
        <Text variant="bodySm" muted>
          {t('requestHint')}
        </Text>

        <View className="gap-2">
          <Text variant="label">{t('chooseSpecialty')}</Text>
          <View style={[rowStyle, { flexWrap: 'wrap', gap: 8 }]}>
            {HOME_VISIT_SPECIALTIES.map((specialty) => {
              const selected = selectedSpecialty === specialty.nameEn;
              return (
                <Pressable
                  key={specialty.id}
                  accessibilityRole="button"
                  onPress={() => setValue('specialty', specialty.nameEn, { shouldValidate: true })}
                  style={{ flexGrow: 1, flexBasis: '47%', minWidth: '47%', maxWidth: '48%' }}
                >
                  <View
                    className={`h-full items-center justify-center rounded-2xl border px-3 py-3 ${
                      selected
                        ? 'border-primary-600 bg-teal-50 dark:bg-teal-950/40'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text variant="label" className="text-center" numberOfLines={2}>
                      {formatSpecialty(specialty.nameEn, tPatient)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {formState.errors.specialty ? (
            <Text variant="caption" className="text-status-error">
              {t('specialtyRequired')}
            </Text>
          ) : null}
        </View>

        <View className="gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <FormInput control={control} name="address" label={t('address')} placeholder={t('addressPlaceholder')} />
          <Button
            title={locating ? t('locating') : t('useCurrentLocation')}
            variant="outline"
            onPress={() => void fillCurrentLocation()}
            loading={locating}
            fullWidth
          />
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <DateCalendarField
                label={t('date')}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message ? tv(fieldState.error.message) : undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="time"
            render={({ field, fieldState }) => (
              <TimePickerField
                label={t('time')}
                hourLabel={t('hour')}
                minuteLabel={t('minute')}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message ? tv(fieldState.error.message) : undefined}
              />
            )}
          />
          <FormInput control={control} name="notes" label={t('notes')} placeholder={t('notesPlaceholder')} />
        </View>

        <Button
          title={t('submit')}
          onPress={handleSubmit(onSubmit)}
          loading={createRequest.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
