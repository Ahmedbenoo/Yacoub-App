import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNursingQuote, resolveNursingServiceIds } from '@/shared/catalog/nursing-services';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HomeNursingStatus } from '@/shared/types/enums';
import type { HomeNursingRequest } from '@/shared/types/models/nursing';

const STATUS_VARIANT = {
  [HomeNursingStatus.REQUESTED]: 'warning',
  [HomeNursingStatus.PRICED]: 'info',
  [HomeNursingStatus.ASSIGNED]: 'info',
  [HomeNursingStatus.ACCEPTED]: 'success',
  [HomeNursingStatus.DECLINED]: 'error',
  [HomeNursingStatus.COMPLETED]: 'success',
} as const;

function Row({ icon, label, value }: { icon: AppIconName; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Icon name={icon} size={16} color="#0D9488" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="bodySm">{value}</Text>
      </View>
    </View>
  );
}

export function NursingRequestSummary({ request }: { request: HomeNursingRequest }) {
  const { t } = useTranslation('nursing');

  return (
    <Card className="gap-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="titleSm" className="min-w-0 flex-1">
          {resolveNursingServiceIds(request)
            .map((id) => t(`services.${id}.name`))
            .join('، ')}
        </Text>
        <Badge label={t(`statuses.${request.status}`)} variant={STATUS_VARIANT[request.status]} />
      </View>
      <Row icon="person" label={t('patient')} value={request.patientName} />
      {request.patientPhone ? <Row icon="bell" label={t('phone')} value={request.patientPhone} /> : null}
      <Row icon="clock" label={t('scheduled')} value={request.scheduledAt} />
      <Row icon="location" label={t('address')} value={request.address} />
      {formatNursingQuote(request) ? (
        <Row
          icon="records"
          label={request.price ? t('price') : t('expectedPrice')}
          value={`${formatNursingQuote(request)} ${t('currency')}`}
        />
      ) : null}
      {request.nurseName ? <Row icon="doctors" label={t('nurse')} value={request.nurseName} /> : null}
    </Card>
  );
}
