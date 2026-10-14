import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HomeVisitStatus } from '@/shared/types/enums';
import type { HomeVisitRequest } from '@/shared/types/models/home-visit';

const STATUS_VARIANT = {
  [HomeVisitStatus.REQUESTED]: 'warning',
  [HomeVisitStatus.ACCEPTED]: 'info',
  [HomeVisitStatus.COMPLETED]: 'success',
} as const;

interface HomeVisitCardProps {
  request: HomeVisitRequest;
  title: string;
  onPress: () => void;
}

export function HomeVisitCard({ request, title, onPress }: HomeVisitCardProps) {
  const { t } = useTranslation('homeVisit');

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20">
          <Icon name="doctors" size={22} color="#0D9488" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text variant="titleSm" className="min-w-0 flex-1" numberOfLines={1}>
              {title}
            </Text>
            <Badge label={t(`statuses.${request.status}`)} variant={STATUS_VARIANT[request.status]} />
          </View>
          <Text variant="bodySm" muted numberOfLines={1}>
            {request.scheduledAt}
          </Text>
          <Text variant="bodySm" muted numberOfLines={1}>
            {request.address}
          </Text>
          {request.price ? <Text variant="label">{t('priceValue', { value: request.price })}</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
}
