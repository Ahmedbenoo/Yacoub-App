import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NotificationItem } from '@/features/appointments/components/NotificationItem';
import { useMarkNotificationReadMutation } from '@/features/appointments/hooks';
import { useNotificationsQuery } from '@/features/appointments/hooks/useNotificationQueries';
import { filterNotificationsByPreferences } from '@/features/appointments/lib/notifications';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Icon } from '@/shared/components/ui/Icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { useNotificationPreferencesStore } from '@/shared/stores/notification-preferences-store';

interface NotificationsPreviewProps {
  notificationsPath?: string;
}

export function NotificationsPreview({ notificationsPath }: NotificationsPreviewProps) {
  const { t } = useTranslation('appointments');
  const isCategoryEnabled = useNotificationPreferencesStore((s) => s.isCategoryEnabled);
  const { data, isLoading } = useNotificationsQuery(3);
  const markReadMutation = useMarkNotificationReadMutation();
  const visibleNotifications = filterNotificationsByPreferences(data?.data ?? [], isCategoryEnabled);

  const openNotification = (notification: (typeof visibleNotifications)[number]) => {
    const nursingRequestId = notification.data?.nursingRequestId;
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    if (typeof nursingRequestId === 'string') {
      router.push(`/(patient)/nursing/${nursingRequestId}` as never);
    }
  };

  return (
    <View className="gap-4">
      <SectionHeader
        title={t('notifications.title')}
        actionLabel={visibleNotifications.length ? t('notifications.viewAll') : undefined}
        onAction={notificationsPath ? () => router.push(notificationsPath as never, { withAnchor: true }) : undefined}
      />

      {isLoading && (
        <View className="gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {!isLoading && visibleNotifications.length === 0 && (
        <EmptyState
          title={t('notifications.empty')}
          icon={
            <View className="h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <Icon name="bell" size={32} color="#F97316" />
            </View>
          }
        />
      )}

      {!isLoading &&
        visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={
              typeof notification.data?.nursingRequestId === 'string'
                ? () => openNotification(notification)
                : undefined
            }
          />
        ))}
    </View>
  );
}
