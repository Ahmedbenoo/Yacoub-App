import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useCreateNursingRequestMutation } from '@/features/nursing/hooks/useNursingQueries';
import {
  homeNursingRequestSchema,
  type HomeNursingRequestForm,
} from '@/features/nursing/schemas/nursing.schemas';
import {
  formatNursingPriceRange,
  isNursingServiceId,
  nursingServicesByKind,
  quoteNursingServices,
  type NursingService,
} from '@/shared/catalog/nursing-services';
import { DateCalendarField } from '@/shared/components/form/DateCalendarField';
import { FormInput } from '@/shared/components/form/FormInput';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';

export function PatientNursingRequestScreen() {
  const { t } = useTranslation('nursing');
  const { t: tv } = useTranslation('validation');
  const { rowStyle } = useLayoutDirection();
  const user = useAuthStore((s) => s.user);
  const createRequest = useCreateNursingRequestMutation();
  const { control, handleSubmit, watch, setValue, formState } = useForm<HomeNursingRequestForm>({
    resolver: zodResolver(homeNursingRequestSchema),
    defaultValues: { serviceIds: [], address: '', date: '', time: '' },
  });

  const selectedIds = watch('serviceIds');
  const quote = quoteNursingServices(selectedIds);

  const toggle = (serviceId: NursingService['id']) => {
    const next = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId];
    setValue('serviceIds', next, { shouldValidate: true });
  };

  const onSubmit = (data: HomeNursingRequestForm) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const serviceIds = data.serviceIds.filter(isNursingServiceId);
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
      <Header showBack title={t('requestTitle')} />
      <View className="gap-5 py-4">
        <Text variant="bodySm" muted>
          {t('requestHint')}
        </Text>
        <Text variant="bodySm">{t('chooseService')}</Text>
        <ServiceGroup
          title={t('visitsTitle')}
          hint={t('visitsHint')}
          services={nursingServicesByKind('visit')}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
        <ServiceGroup
          title={t('shiftsTitle')}
          hint={t('shiftsHint')}
          services={nursingServicesByKind('shift')}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
        {formState.errors.serviceIds?.message ? (
          <Text variant="caption" className="text-status-error">
            {t('servicePlaceholder')}
          </Text>
        ) : null}
        {quote ? (
          <View style={[rowStyle, { alignItems: 'center', justifyContent: 'space-between' }]} className="rounded-2xl bg-primary-600 px-4 py-3">
            <Text variant="label" className="text-white">
              {t('selectionTotal', { count: selectedIds.length })}
            </Text>
            <Text variant="label" className="text-white">
              {formatNursingPriceRange(quote.priceMin, quote.priceMax)} {t('currency')}
            </Text>
          </View>
        ) : null}
        <View className="gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <FormInput control={control} name="address" label={t('address')} />
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
          <FormInput
            control={control}
            name="time"
            label={t('time')}
            placeholder={t('timePlaceholder')}
            autoCapitalize="none"
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

function ServiceGroup({
  title,
  hint,
  services,
  selectedIds,
  onToggle,
}: {
  title: string;
  hint: string;
  services: NursingService[];
  selectedIds: string[];
  onToggle: (serviceId: NursingService['id']) => void;
}) {
  const { t } = useTranslation('nursing');
  const { rowStyle } = useLayoutDirection();

  return (
    <View className="gap-2">
      <View style={[rowStyle, { alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }]}>
        <Text variant="titleSm">{title}</Text>
        <Text variant="caption" muted>
          {hint}
        </Text>
      </View>
      {services.map((service) => {
        const selected = selectedIds.includes(service.id);
        return (
          <Pressable key={service.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => onToggle(service.id)}>
            <View
              style={[rowStyle, { alignItems: 'flex-start', gap: 12 }]}
              className={`rounded-2xl border px-3 py-3 ${
                selected
                  ? 'border-primary-600 bg-teal-50 dark:bg-teal-950/40'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              <View
                className={`mt-0.5 h-[22px] w-[22px] items-center justify-center rounded-md border ${
                  selected ? 'border-primary-600 bg-primary-600' : 'border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-900'
                }`}
              >
                {selected ? (
                  <Text variant="caption" className="text-white">
                    ✓
                  </Text>
                ) : null}
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <View style={[rowStyle, { alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }]}>
                  <Text variant="label" className="min-w-0 flex-1">
                    {t(`services.${service.id}.name`)}
                  </Text>
                  <View className={`rounded-full px-2.5 py-1 ${selected ? 'bg-white dark:bg-slate-900' : 'bg-teal-50 dark:bg-teal-950/50'}`}>
                    <Text variant="caption" className="text-primary-700">
                      {formatNursingPriceRange(service.priceMin, service.priceMax)} {t('currency')}
                    </Text>
                  </View>
                </View>
                <Text variant="caption" muted>
                  {t(`services.${service.id}.description`)}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
