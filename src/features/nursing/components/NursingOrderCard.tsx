import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNursingQuote, resolveNursingServiceIds } from '@/shared/catalog/nursing-services';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLocaleStore } from '@/shared/stores';
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

interface NursingOrderCardProps {
  request: HomeNursingRequest;
  onPress: () => void;
}

export function NursingOrderCard({ request, onPress }: NursingOrderCardProps) {
  const { t } = useTranslation('nursing');
  const isRtl = useLocaleStore((s) => s.isRtl);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20">
          <Icon name="home" size={22} color="#0D9488" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text variant="titleSm" className="min-w-0 flex-1" numberOfLines={2}>
              {resolveNursingServiceIds(request)
                .map((id) => t(`services.${id}.name`))
                .join('، ')}
            </Text>
            <Badge label={t(`statuses.${request.status}`)} variant={STATUS_VARIANT[request.status]} />
          </View>
          <Text variant="bodySm" muted numberOfLines={1}>
            {request.scheduledAt}
          </Text>
          <Text variant="bodySm" muted numberOfLines={1}>
            {request.address}
          </Text>
          {formatNursingQuote(request) ? (
            <Text variant="label">
              {formatNursingQuote(request)} {t('currency')}
            </Text>
          ) : null}
        </View>
        <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" />
      </Card>
    </Pressable>
  );
}
