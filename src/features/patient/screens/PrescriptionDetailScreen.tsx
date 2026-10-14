import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { usePrescriptionDetailQuery } from '@/features/clinical/prescriptions/hooks/usePatientPrescriptionQueries';
import { PrescriptionLetter } from '@/features/clinical/prescriptions/components/PrescriptionLetter';
import {
  labelsFromT,
  printIssuedPrescription,
} from '@/features/clinical/prescriptions/lib/prescription-document';
import { openPrescriptionWhatsApp, sharePrescription } from '@/features/clinical/prescriptions/lib/share-prescription';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { Locale } from '@/shared/types/enums';

export function PrescriptionDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const { data: prescription, isLoading, isError, refetch } = usePrescriptionDetailQuery(id ?? '');

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
      <Header showBack title={t('prescription.title')} />

      <View className="gap-4 py-4">
        <PrescriptionLetter prescription={prescription} />
        <Button
          title={t('prescription.download')}
          fullWidth
          onPress={() => {
            void printIssuedPrescription(prescription, labelsFromT(t, prescription), locale === Locale.AR).then(
              (printed) => {
                if (!printed) Toast.show({ type: 'info', text1: t('prescription.printUnavailable') });
              },
            );
          }}
        />
        <Button
          title={t('prescription.share')}
          variant="outline"
          fullWidth
          onPress={() => {
            void sharePrescription(prescription, locale === Locale.AR).then((result) => {
              if (result === 'copied') Toast.show({ type: 'success', text1: t('prescription.shareCopied') });
            });
          }}
        />
        <Button
          title={t('prescription.shareWhatsapp')}
          variant="outline"
          fullWidth
          onPress={() => {
            void openPrescriptionWhatsApp(prescription, locale === Locale.AR);
          }}
        />
      </View>
    </Screen>
  );
}
