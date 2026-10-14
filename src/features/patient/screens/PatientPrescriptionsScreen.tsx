import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useMyPrescriptionsQuery } from '@/features/clinical/prescriptions/hooks/usePatientPrescriptionQueries';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientPrescriptionHref, getRouteParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { getPrescriptionDisplayDate, localizedMedicationText } from '@/shared/types/models/prescription';

export function PatientPrescriptionsScreen() {
  const { visitId: visitIdParam } = useLocalSearchParams<{ visitId?: string | string[] }>();
  const visitId = getRouteParam(visitIdParam);
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const { data, isLoading, isError, refetch } = useMyPrescriptionsQuery();

  const prescriptions = (data ?? []).filter((item) => !visitId || item.visitId === visitId);

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('prescription.listTitle')} />
      <View className="gap-3 py-4">
        {isLoading ? <Spinner /> : null}
        {isError ? (
          <ErrorState message={t('prescription.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
        ) : null}
        {!isLoading && !isError && prescriptions.length === 0 ? (
          <EmptyState title={t('prescription.emptyTitle')} description={t('prescription.emptyDescription')} />
        ) : null}
        {prescriptions.map((prescription) => (
          <Pressable
            key={prescription.id}
            accessibilityRole="button"
            onPress={() => router.push(getPatientPrescriptionHref(prescription.id))}
          >
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="min-w-0 flex-1 gap-1">
                  <Text variant="titleSm">
                    {prescription.number
                      ? t('prescription.number', { value: prescription.number })
                      : t('prescription.title')}
                  </Text>
                  <Text variant="bodySm" muted>
                    {formatDisplayDate(getPrescriptionDisplayDate(prescription), locale)}
                  </Text>
                  {prescription.doctorName ? (
                    <Text variant="bodySm" muted>
                      {prescription.doctorName}
                    </Text>
                  ) : null}
                </View>
                <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" />
              </View>
              {prescription.medications.map((medication, index) => (
                <View key={`${medication.name}-${index}`} className="gap-0.5">
                  <Text variant="label">{medication.name}</Text>
                  <Text variant="bodySm" muted>
                    {t('prescription.dosage', { value: medication.dosage })}
                  </Text>
                  <Text variant="bodySm" muted>
                    {t('prescription.frequency', { value: medication.frequency })}
                  </Text>
                  <Text variant="bodySm" muted>
                    {t('prescription.duration', { value: medication.duration })}
                  </Text>
                </View>
              ))}
              {localizedMedicationText(prescription.instructions, prescription.instructionsAr, locale) ? (
                <Text variant="bodySm" muted>
                  {localizedMedicationText(prescription.instructions, prescription.instructionsAr, locale)}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
