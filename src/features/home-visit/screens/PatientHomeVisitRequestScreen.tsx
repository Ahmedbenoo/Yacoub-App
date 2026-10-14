import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useDoctorSpecialties } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { useCreateHomeVisitMutation } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { homeVisitRequestSchema, type HomeVisitRequestForm } from '@/features/home-visit/schemas/home-visit.schemas';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { FormInput } from '@/shared/components/form/FormInput';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';

export function PatientHomeVisitRequestScreen() {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');
  const user = useAuthStore((s) => s.user);
  const specialties = useDoctorSpecialties();
  const createRequest = useCreateHomeVisitMutation();
  const { control, handleSubmit, watch, setValue, formState } = useForm<HomeVisitRequestForm>({
    resolver: zodResolver(homeVisitRequestSchema),
    defaultValues: { specialty: '', address: '', date: '', time: '', notes: '' },
  });
  const selectedSpecialty = watch('specialty');

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
      <View className="gap-4 py-4">
        <Text variant="bodySm" muted>
          {t('requestHint')}
        </Text>
        <View className="gap-2">
          <Text variant="label">{t('chooseSpecialty')}</Text>
          {specialties.map((specialty) => {
            const selected = selectedSpecialty === specialty;
            return (
              <Pressable
                key={specialty}
                accessibilityRole="button"
                onPress={() => setValue('specialty', specialty, { shouldValidate: true })}
              >
                <Card className={`flex-row items-center gap-3 ${selected ? 'border-2 border-primary-600' : ''}`}>
                  <Text variant="label" className="min-w-0 flex-1">
                    {formatSpecialty(specialty, tPatient)}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
          {formState.errors.specialty ? (
            <Text variant="caption" className="text-status-error">
              {t('specialtyRequired')}
            </Text>
          ) : null}
        </View>
        <Card className="gap-4">
          <FormInput control={control} name="address" label={t('address')} placeholder={t('addressPlaceholder')} />
          <FormInput control={control} name="date" label={t('date')} placeholder={t('datePlaceholder')} autoCapitalize="none" />
          <FormInput control={control} name="time" label={t('time')} placeholder={t('timePlaceholder')} autoCapitalize="none" />
          <FormInput control={control} name="notes" label={t('notes')} placeholder={t('notesPlaceholder')} />
        </Card>
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
