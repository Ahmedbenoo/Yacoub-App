import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useClinicDetailQuery } from '@/features/catalog/clinics/hooks/useClinicsQueries';
import {
  getClinicAddressLine,
  getClinicName,
  getClinicStreet,
} from '@/features/clinic/lib/formatters';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientClinicHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

export function ClinicVisitPlaceCard({
  clinicId,
  branchLabel,
}: {
  clinicId: string;
  branchLabel?: string;
}) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const clinicQuery = useClinicDetailQuery(clinicId);
  const clinic = clinicQuery.data;

  if (!clinic) return null;

  const name = getClinicName(clinic, locale);
  const street = getClinicStreet(clinic, locale);
  const city = getClinicAddressLine(clinic, locale);
  const address = [street, city].filter(Boolean).join(locale === 'ar' ? '، ' : ', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('booking.viewClinic')}
      onPress={() => router.push(getPatientClinicHref(clinic.id))}
    >
      <Card className="gap-3">
        <Text variant="titleSm">{t('booking.atClinic')}</Text>
        <Text variant="bodySm" muted>
          {t('booking.clinicHint')}
        </Text>
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Icon name="clinic" size={18} color="#0D9488" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text variant="label">{name}</Text>
            {branchLabel ? (
              <Text variant="caption" muted>
                {branchLabel}
              </Text>
            ) : null}
            {address ? (
              <Text variant="bodySm" muted>
                {address}
              </Text>
            ) : null}
          </View>
          <Icon name="chevronLeft" size={18} color="#94A3B8" />
        </View>
      </Card>
    </Pressable>
  );
}
