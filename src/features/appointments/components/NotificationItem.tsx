import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getNotificationCopy } from '@/features/appointments/lib/notifications';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { Notification } from '@/shared/types/models/notification';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { t } = useTranslation('appointments');
  const { title, body } = getNotificationCopy(notification, t);
  const isUnread = !notification.readAt;
  const { isRtl } = useLayoutDirection();
  const isDark = useResolvedColorScheme() === 'dark';

  const inner = (
    <>
      {isUnread && (
        <View
          className="absolute bottom-0 top-0 w-1 bg-primary-500"
          style={isRtl ? { right: 0 } : { left: 0 }}
        />
      )}

      <Row className={`items-start gap-3 ${isUnread ? (isRtl ? 'pe-1' : 'ps-1') : ''}`}>
        <View
          className={`h-10 w-10 shrink-0 items-center justify-center rounded-full ${themeBg(isDark, 'bg-orange-100', 'bg-orange-900/30')}`}
        >
          <Icon name="bell" size={18} color="#F97316" />
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Row className="items-center gap-2">
            <Text variant="label" className="min-w-0 flex-1 font-semibold" numberOfLines={1}>
              {title}
            </Text>
            {isUnread && <View className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
          </Row>
          <Text variant="bodySm" muted numberOfLines={2}>
            {body}
          </Text>
        </View>
      </Row>
    </>
  );

  const cardClassName = isUnread
    ? `overflow-hidden ${themeBg(isDark, 'border-primary-200 bg-primary-50/50', 'border-primary-800 bg-primary-900/20')}`
    : 'overflow-hidden';

  if (!onPress) {
    return <Card className={cardClassName}>{inner}</Card>;
  }

  return (
    <Card className={`${cardClassName} p-0`}>
      <Pressable accessibilityRole="button" onPress={onPress} className="p-4 active:opacity-80">
        {inner}
      </Pressable>
    </Card>
  );
}
