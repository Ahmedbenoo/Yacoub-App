import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useStaffPrescriptionQuery } from '@/features/clinical/hooks/useClinicalQueries';
import { PrescriptionLetter } from '@/features/clinical/prescriptions/components/PrescriptionLetter';
import {
  labelsFromT,
  printIssuedPrescription,
} from '@/features/clinical/prescriptions/lib/prescription-document';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { Locale } from '@/shared/types/enums';

export default function PrescriptionFileScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const { data: prescription, isLoading, isError, refetch } = useStaffPrescriptionQuery(id);

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
        <ErrorState message={t('prescription.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  return (
    <Screen scroll className="bg-slate-100 px-5">
      <View className="gap-4 py-6">
        <PrescriptionLetter prescription={prescription} />
        <Button
          title={t('prescription.print')}
          fullWidth
          onPress={() => {
            void printIssuedPrescription(prescription, labelsFromT(t, prescription), locale === Locale.AR).then(
              (printed) => {
                if (!printed) Toast.show({ type: 'info', text1: t('prescription.printUnavailable') });
              },
            );
          }}
        />
      </View>
    </Screen>
  );
}
