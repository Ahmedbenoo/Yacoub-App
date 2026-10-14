import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useStaffPrescriptionQuery } from '@/features/clinical/hooks/useClinicalQueries';
import { PrescriptionLetter } from '@/features/clinical/prescriptions/components/PrescriptionLetter';
import {
  labelsFromT,
  printIssuedPrescription,
} from '@/features/clinical/prescriptions/lib/prescription-document';
import { sendPrescriptionOnWhatsApp } from '@/features/clinical/prescriptions/lib/share-prescription';
import { usePatientDetailQuery } from '@/features/patients/hooks/usePatientQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore, useLocaleStore } from '@/shared/stores';
import { Locale, PrescriptionStatus, UserRole } from '@/shared/types/enums';

export function StaffPrescriptionDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const canPrint =
    roles.includes(UserRole.DOCTOR) ||
    roles.includes(UserRole.SECRETARY) ||
    roles.includes(UserRole.ADMIN);
  const { data: prescription, isLoading, isError, refetch } = useStaffPrescriptionQuery(id ?? '');
  const { data: patient } = usePatientDetailQuery(prescription?.patientId ?? '');
  const canSendWhatsApp =
    prescription?.status === PrescriptionStatus.ISSUED && Boolean(patient?.phone);

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !prescription) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('prescription.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-5">
      <Header showBack />

      <View className="gap-4 py-4">
        <PrescriptionLetter prescription={prescription} />

        {canSendWhatsApp && patient?.phone ? (
          <Button
            title={t('prescription.whatsapp')}
            fullWidth
            onPress={() => {
              void sendPrescriptionOnWhatsApp(patient.phone!, prescription, locale === Locale.AR);
            }}
          />
        ) : null}

        {canPrint && (
          <Button
            title={t('prescription.print')}
            variant="outline"
            fullWidth
            onPress={() => {
              void printIssuedPrescription(prescription, labelsFromT(t, prescription), locale === Locale.AR).then(
                (printed) => {
                  if (!printed) Toast.show({ type: 'info', text1: t('prescription.printUnavailable') });
                },
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}
