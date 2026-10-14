import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { AvailabilityDayCard } from '@/features/doctor/components/AvailabilityDayCard';
import { formatTime } from '@/features/doctor/lib/formatters';
import { useUpdateAvailabilityMutation } from '@/features/doctor/hooks';
import { useDoctorAvailabilityQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { Select } from '@/shared/components/form/Select';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { AvailabilitySlot } from '@/shared/types/models/availability';

const SLOT_MINUTES = [15, 20, 30, 45, 60];
const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

const TIME_OPTIONS = Array.from({ length: 15 }, (_, index) => {
  const value = `${String(index + 8).padStart(2, '0')}:00`;
  return { value, label: `\u2066${formatTime(value)}\u2069` };
});

function hoursAreValid(startTime: string, endTime: string): boolean {
  return startTime < endTime;
}

function windowFor(slots: AvailabilitySlot[], dayOfWeek: number): { startTime: string; endTime: string } | null {
  const daySlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek);
  if (!daySlots.length) return null;
  const startTime = [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime))[0].startTime;
  const endTime = [...daySlots].sort((a, b) => a.endTime.localeCompare(b.endTime)).at(-1)?.endTime ?? DEFAULT_END;
  return { startTime, endTime };
}

function withDay(
  slots: AvailabilitySlot[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): AvailabilitySlot[] {
  return [
    ...slots.filter((slot) => slot.dayOfWeek !== dayOfWeek),
    { dayOfWeek, startTime, endTime },
  ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export function AvailabilityScreen({ doctorId }: { doctorId: string }) {
  const { t } = useTranslation('doctor');
  const isDark = useResolvedColorScheme() === 'dark';
  const { data, isLoading, isError, refetch } = useDoctorAvailabilityQuery(doctorId);
  const updateMutation = useUpdateAvailabilityMutation();
  const [sharedStart, setSharedStart] = useState(DEFAULT_START);
  const [sharedEnd, setSharedEnd] = useState(DEFAULT_END);

  if (isLoading) {
    return (
      <Screen>
        <Header showBack title={t('availability.title')} />
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <Header showBack title={t('availability.title')} />
        <ErrorState message={t('availability.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const save = (slots: AvailabilitySlot[], slotMinutes = data.slotMinutes) => {
    updateMutation.mutate({ doctorId, slots, slotMinutes });
  };

  const rejectHours = () => {
    Toast.show({ type: 'error', text1: t('availability.invalidHours') });
  };

  const setSlotMinutes = (minutes: number) => {
    save(data.slots, minutes);
  };

  const changeDay = (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!hoursAreValid(startTime, endTime)) {
      rejectHours();
      return;
    }
    save(withDay(data.slots, dayOfWeek, startTime, endTime));
  };

  const toggleDay = (dayOfWeek: number) => {
    const current = windowFor(data.slots, dayOfWeek);
    if (current) {
      save(data.slots.filter((slot) => slot.dayOfWeek !== dayOfWeek));
      return;
    }
    changeDay(dayOfWeek, DEFAULT_START, DEFAULT_END);
  };

  const applyToAllDays = () => {
    if (!hoursAreValid(sharedStart, sharedEnd)) {
      rejectHours();
      return;
    }
    save(WEEK_DAYS.map((dayOfWeek) => ({ dayOfWeek, startTime: sharedStart, endTime: sharedEnd })));
  };

  return (
    <Screen scroll className="pt-2 pb-12">
      <Header showBack title={t('availability.title')} />

      <View className="gap-5 pb-2">
        <View className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 ${themeBg(isDark, 'bg-primary-50', 'bg-primary-900/20')}`}>
          <View className={`h-9 w-9 items-center justify-center rounded-xl ${themeBg(isDark, 'bg-white', 'bg-slate-800')}`}>
            <Icon name="clinic" size={18} color="#0D9488" />
          </View>
          <Text variant="bodySm" className={`flex-1 ${isDark ? 'text-primary-200' : 'text-primary-800'}`}>
            {t('availability.subtitle', { branch: data.branchName })}
          </Text>
        </View>

        <View className="gap-2">
          <Text variant="label">{t('availability.slotMinutes')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {SLOT_MINUTES.map((minutes) => {
              const selected = data.slotMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  onPress={() => setSlotMinutes(minutes)}
                  disabled={updateMutation.isPending}
                  className={`rounded-full px-3 py-2 ${selected ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
                >
                  <Text variant="caption" className={selected ? 'text-white' : undefined}>
                    {t('availability.minutes', { count: minutes })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Card className="gap-3">
          <Text variant="titleSm">{t('availability.sameHours')}</Text>
          <Text variant="caption" muted>
            {t('availability.sameHoursHint')}
          </Text>
          <View className="flex-row gap-3">
            <View className="min-w-0 flex-1">
              <Select
                label={t('availability.from')}
                value={sharedStart}
                options={TIME_OPTIONS}
                onChange={setSharedStart}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Select
                label={t('availability.to')}
                value={sharedEnd}
                options={TIME_OPTIONS}
                onChange={setSharedEnd}
              />
            </View>
          </View>
          <Button
            title={t('availability.applyAll')}
            variant="outline"
            onPress={applyToAllDays}
            loading={updateMutation.isPending}
            fullWidth
          />
        </Card>

        {WEEK_DAYS.map((day) => {
          const window = windowFor(data.slots, day);
          return (
            <AvailabilityDayCard
              key={day}
              dayOfWeek={day}
              startTime={window?.startTime}
              endTime={window?.endTime}
              timeOptions={TIME_OPTIONS}
              onToggle={() => toggleDay(day)}
              onChangeHours={(startTime, endTime) => changeDay(day, startTime, endTime)}
              disabled={updateMutation.isPending}
            />
          );
        })}

        <Text variant="caption" muted className="text-center">
          {t('availability.tapHint')}
        </Text>
      </View>
    </Screen>
  );
}
