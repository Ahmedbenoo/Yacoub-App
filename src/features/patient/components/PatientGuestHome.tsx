import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PatientHomeCatalogRails } from '@/features/patient/components/PatientHomeCatalogRails';
import { PatientPathChoices } from '@/features/patient/components/PatientPathChoices';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';

const BENEFITS: { icon: AppIconName; titleKey: string; descriptionKey: string }[] = [
  {
    icon: 'calendar',
    titleKey: 'guest.whyBookingTitle',
    descriptionKey: 'guest.whyBookingDescription',
  },
  {
    icon: 'doctors',
    titleKey: 'guest.whyDoctorsTitle',
    descriptionKey: 'guest.whyDoctorsDescription',
  },
  {
    icon: 'records',
    titleKey: 'guest.whyRecordsTitle',
    descriptionKey: 'guest.whyRecordsDescription',
  },
];

export function PatientGuestHome() {
  const { t } = useTranslation('patient');

  return (
    <View className="gap-4 py-4">
      <Text variant="titleMd">{t('guest.heroTitle')}</Text>

      <PatientPathChoices isAuthenticated={false} />

      <PatientHomeCatalogRails />

      <Card elevated className="gap-4">
        <Text variant="titleSm">{t('guest.whyTitle')}</Text>
        {BENEFITS.map((benefit) => (
          <Row key={benefit.titleKey} className="items-start gap-3">
            <View className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
              <Icon name={benefit.icon} size={20} color="#0D9488" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="label">{t(benefit.titleKey)}</Text>
              <Text variant="bodySm" muted>
                {t(benefit.descriptionKey)}
              </Text>
            </View>
          </Row>
        ))}
      </Card>
    </View>
  );
}
