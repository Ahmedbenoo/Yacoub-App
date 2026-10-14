import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NotificationList } from '@/features/appointments/components/NotificationList';
import {
  useMarkAllNotificationsReadMutation,
  useNotificationsQuery,
} from '@/features/appointments/hooks';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { getAppointmentHref } from '@/shared/navigation/routes';
import type { Notification } from '@/shared/types/models/notification';
import { UserRole } from '@/shared/types/enums';

interface NotificationsScreenProps {
  viewerRole: UserRole;
}

export function NotificationsScreen({ viewerRole }: NotificationsScreenProps) {
  const { t } = useTranslation('appointments');
  const { data } = useNotificationsQuery(20);
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const unreadCount = data?.data.filter((item) => !item.readAt).length ?? 0;

  const handlePressNotification = (notification: Notification) => {
    const nursingRequestId = notification.data?.nursingRequestId;
    if (viewerRole === UserRole.PATIENT && typeof nursingRequestId === 'string') {
      router.push(`/(patient)/nursing/${nursingRequestId}` as never);
      return;
    }

    const appointmentId = notification.data?.appointmentId;
    if (typeof appointmentId === 'string') {
      router.push(getAppointmentHref(viewerRole, appointmentId), { withAnchor: true });
    }
  };

  const markAllAction =
    unreadCount > 0 ? (
      <Pressable
        onPress={() => markAllReadMutation.mutate()}
        disabled={markAllReadMutation.isPending}
        className="active:opacity-70"
      >
        <Text variant="caption" className="text-primary-600 dark:text-primary-400">
          {t('notifications.markAllRead')}
        </Text>
      </Pressable>
    ) : null;

  return (
    <Screen padded={false} className="flex-1 px-5 pt-2">
      <Header showBack title={t('notifications.title')} rightAction={markAllAction} />
      <NotificationList
        onPressNotification={handlePressNotification}
        showMarkAllRead={false}
      />
    </Screen>
  );
}
