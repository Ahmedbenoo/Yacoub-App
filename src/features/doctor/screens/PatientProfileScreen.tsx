import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { MedicalHistoryList } from '@/features/doctor/components/MedicalHistoryList';
import { PregnancyPanel } from '@/features/obgyn/components/PregnancyPanel';
import { isObstetricsGynecology } from '@/features/obgyn/lib/specialty';
import { useDoctorDetailQuery } from '@/features/patient/hooks/useDoctorsQueries';
import {
  usePatientDetailQuery,
  usePatientHistoryQuery,
} from '@/features/patients/hooks/usePatientQueries';
import {
  calculateAge,
  formatGender,
  getFullName,
} from '@/features/doctor/lib/formatters';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 11) return `0${digits.slice(2)}`;
  return phone;
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b border-slate-100 dark:border-slate-700/80'}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F0FDFA] dark:bg-primary-900/30">
        <Icon name={icon} size={18} color="#0F766E" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="label">{value}</Text>
      </View>
    </View>
  );
}

export function PatientProfileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation(['doctor', 'common']);
  const viewerId = useAuthStore((s) => s.user?.id);
  const viewer = useDoctorDetailQuery(viewerId ?? '');
  const showPregnancy = isObstetricsGynecology(viewer.data?.specialty);

  const { data: patient, isLoading, isError, refetch } = usePatientDetailQuery(id);
  const { data: history, isLoading: historyLoading } = usePatientHistoryQuery(id);

  if (isLoading) {
    return (
      <Screen>
        <Header showBack />
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !patient) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('doctor:patients.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack />

      <View className="gap-5 pb-10">
        <View className="items-center gap-3 pt-1">
          <View className="rounded-full border-4 border-white bg-[#CCFBF1] p-0.5 dark:border-slate-800">
            <Avatar
              firstName={patient.firstName}
              lastName={patient.lastName}
              imageUrl={patient.avatarUrl}
              size="xl"
            />
          </View>
          <View className="items-center gap-1">
            <Text variant="titleMd" className="text-center">
              {getFullName(patient.firstName, patient.lastName)}
            </Text>
            <Text variant="caption" muted>
              {formatGender(patient.gender)}
            </Text>
          </View>
        </View>

        <Card className="gap-0 overflow-hidden p-0">
          {patient.phone ? (
            <InfoRow icon="phone" label={t('doctor:patients.phone')} value={displayPhone(patient.phone)} />
          ) : null}
          <InfoRow
            icon="person"
            label={t('doctor:patients.age')}
            value={t('doctor:patients.ageYears', { age })}
          />
          {patient.bloodType ? (
            <InfoRow icon="records" label={t('doctor:patients.bloodType')} value={patient.bloodType} />
          ) : null}
          <InfoRow
            icon="clinic"
            label={t('doctor:patients.allergies')}
            value={patient.allergies.length ? patient.allergies.join('، ') : t('doctor:patients.none')}
          />
          <InfoRow
            icon="doctors"
            label={t('doctor:patients.conditions')}
            value={
              patient.chronicConditions.length
                ? patient.chronicConditions.join('، ')
                : t('doctor:patients.none')
            }
            last
          />
        </Card>

        {showPregnancy ? <PregnancyPanel patientId={patient.id} /> : null}

        <View className="gap-3">
          <Text variant="titleSm">{t('doctor:patients.medicalHistory')}</Text>
          {historyLoading ? (
            <Spinner />
          ) : (
            <MedicalHistoryList entries={history ?? []} viewerRole={UserRole.DOCTOR} />
          )}
        </View>
      </View>
    </Screen>
  );
}
