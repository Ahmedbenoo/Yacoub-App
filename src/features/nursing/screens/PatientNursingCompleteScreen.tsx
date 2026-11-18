import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useCreateNursingRequestMutation } from '@/features/nursing/hooks/useNursingQueries';
import {
  homeNursingDetailsSchema,
  type HomeNursingDetailsForm,
} from '@/features/nursing/schemas/nursing.schemas';
import { formatNursingPriceRange, isNursingServiceId, quoteNursingServices } from '@/shared/catalog/nursing-services';
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

function readServicesParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(isNursingServiceId);
}

export function PatientNursingCompleteScreen() {
  const { t } = useTranslation('nursing');
  const { t: tv } = useTranslation('validation');
  const { rowStyle } = useLayoutDirection();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ services?: string | string[] }>();
  const serviceIds = readServicesParam(params.services);
  const quote = quoteNursingServices(serviceIds);
  const createRequest = useCreateNursingRequestMutation();
  const [locating, setLocating] = useState(false);
  const { control, handleSubmit, setValue } = useForm<HomeNursingDetailsForm>({
    resolver: zodResolver(homeNursingDetailsSchema),
    defaultValues: { address: '', date: '', time: '' },
  });

  useEffect(() => {
    if (serviceIds.length === 0) {
      router.replace('/(patient)/nursing/new' as never);
    }
  }, [serviceIds.length]);

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

  const onSubmit = (data: HomeNursingDetailsForm) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!serviceIds.length) return;
    createRequest.mutate(
      {
        patientUserId: user.id,
        patientName: `${user.firstName} ${user.lastName}`.trim(),
        patientPhone: user.phone,
        serviceId: serviceIds[0],
        serviceIds,
        address: data.address,
        scheduledAt: `${data.date} ${data.time}`,
      },
      { onSuccess: () => router.replace('/(patient)/nursing' as never) },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('completeTitle')} />
      <View className="gap-5 py-4">
        {quote ? (
          <View
            style={[rowStyle, { alignItems: 'center', justifyContent: 'space-between' }]}
            className="rounded-2xl bg-primary-600 px-4 py-3"
          >
            <Text variant="label" className="text-white">
              {t('selectionTotal', { count: serviceIds.length })}
            </Text>
            <Text variant="label" className="text-white">
              {formatNursingPriceRange(quote.priceMin, quote.priceMax)} {t('currency')}
            </Text>
          </View>
        ) : null}

        <View className="gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <FormInput control={control} name="address" label={t('address')} />
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
