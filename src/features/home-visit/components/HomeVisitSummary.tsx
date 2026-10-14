import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatSpecialty } from '@/features/patient/lib/formatters';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { HomeVisitStatus } from '@/shared/types/enums';
import type { HomeVisitRequest } from '@/shared/types/models/home-visit';

const STATUS_VARIANT = {
  [HomeVisitStatus.REQUESTED]: 'warning',
  [HomeVisitStatus.ACCEPTED]: 'info',
  [HomeVisitStatus.COMPLETED]: 'success',
} as const;

export function HomeVisitSummary({ request }: { request: HomeVisitRequest }) {
  const { t } = useTranslation('homeVisit');
  const { t: tPatient } = useTranslation('patient');

  return (
    <Card className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text variant="titleSm" className="min-w-0 flex-1">
          {formatSpecialty(request.specialty, tPatient)}
        </Text>
        <Badge label={t(`statuses.${request.status}`)} variant={STATUS_VARIANT[request.status]} />
      </View>
      <Text variant="body">{request.patientName}</Text>
      <Text variant="bodySm" muted>
        {request.scheduledAt}
      </Text>
      <Text variant="bodySm">{request.address}</Text>
      {request.notes ? (
        <Text variant="bodySm" muted>
          {request.notes}
        </Text>
      ) : null}
      {request.doctorName ? (
        <Text variant="body">{t('doctorName', { name: request.doctorName })}</Text>
      ) : null}
      {request.price ? <Text variant="label">{t('priceValue', { value: request.price })}</Text> : null}
    </Card>
  );
}
