import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAddDoseMutation, useChildChartQuery } from '@/features/obgyn/hooks/useObgynQueries';
import { ltr } from '@/features/obgyn/lib/specialty';
import { useStartVisitMutation } from '@/features/doctor/hooks';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { DateCalendarField } from '@/shared/components/form/DateCalendarField';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { getVisitHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import { router } from 'expo-router';

export function ChildChartScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('doctor');
  const role = useAuthStore((s) => s.activeRole);
  const chart = useChildChartQuery(id ?? '');
  const addDose = useAddDoseMutation(id ?? '');
  const startVisit = useStartVisitMutation();
  const [label, setLabel] = useState('');
  const [dueAt, setDueAt] = useState('');
  const isDoctor = role === UserRole.DOCTOR;

  if (chart.isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (chart.isError || !chart.data) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('patients.error')} onRetry={() => chart.refetch()} />
      </Screen>
    );
  }

  const data = chart.data;

  return (
    <Screen scroll className="px-5">
      <Header showBack title={data.childName} />
      <View className="gap-4 py-4">
        <Card className="gap-1">
          <Text variant="titleSm">{data.childName}</Text>
          <Text variant="bodySm">{ltr(data.dateOfBirth)}</Text>
        </Card>
        <Card className="gap-2">
          <Text variant="label">{t('obgyn.doses')}</Text>
          {data.doses.map((dose) => (
            <Text key={dose.id} variant="bodySm">
              {dose.label} · {ltr(dose.dueAt)} · {dose.status === 'given' ? t('obgyn.given') : t('obgyn.doseDue')}
            </Text>
          ))}
          {isDoctor ? (
            <>
              <Input label={t('obgyn.doseLabel')} value={label} onChangeText={setLabel} />
              <DateCalendarField label={t('obgyn.due')} value={dueAt} onChange={setDueAt} />
              <Button
                title={t('obgyn.addDose')}
                variant="outline"
                loading={addDose.isPending}
                onPress={() => {
                  if (!label.trim() || !dueAt) return;
                  addDose.mutate({ label, dueAt }, { onSuccess: () => { setLabel(''); setDueAt(''); } });
                }}
              />
            </>
          ) : null}
        </Card>
        <Card className="gap-2">
          <Text variant="label">{t('obgyn.appointments')}</Text>
          {data.appointments.length === 0 ? <Text variant="bodySm" muted>{t('patients.historyEmpty')}</Text> : null}
          {data.appointments.map((appointment) => (
            <Text key={appointment.id} variant="bodySm">
              {ltr(appointment.scheduledAt)} · {appointment.status}
            </Text>
          ))}
        </Card>
        <Card className="gap-2">
          <Text variant="label">{t('obgyn.exams')}</Text>
          {data.visits.map((visit) => (
            <Text key={visit.id} variant="bodySm">
              {ltr(visit.startedAt.slice(0, 10))} · {visit.diagnosis ?? ''}
            </Text>
          ))}
          {isDoctor ? (
            <Button
              title={t('visit.startVisit')}
              onPress={() =>
                startVisit.mutate(
                  { patientId: data.link.childPatientId },
                  { onSuccess: (visit) => router.push(getVisitHref(UserRole.DOCTOR, visit.id)) },
                )
              }
              loading={startVisit.isPending}
            />
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}
