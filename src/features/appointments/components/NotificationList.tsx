import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NotificationItem } from '@/features/appointments/components/NotificationItem';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/features/appointments/hooks';
import { filterNotificationsByPreferences } from '@/features/appointments/lib/notifications';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { SkeletonCard } from '@/shared/components/feedback/Skeleton';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useNotificationPreferencesStore } from '@/shared/stores/notification-preferences-store';
import type { Notification } from '@/shared/types/models/notification';

interface NotificationListProps {
  onPressNotification?: (notification: Notification) => void;
  showMarkAllRead?: boolean;
}

export function NotificationList({
  onPressNotification,
  showMarkAllRead = true,
}: NotificationListProps) {
  const { t } = useTranslation('appointments');
  const { t: tc } = useTranslation('common');
  const { alignInlineEnd } = useLayoutDirection();
  const isCategoryEnabled = useNotificationPreferencesStore((s) => s.isCategoryEnabled);
  const { data, isLoading, isError, refetch, isRefetching } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount =
    filterNotificationsByPreferences(data?.data ?? [], isCategoryEnabled).filter(
      (item) => !item.readAt,
    ).length ?? 0;
  const visibleNotifications = filterNotificationsByPreferences(data?.data ?? [], isCategoryEnabled);

  const handlePress = (notification: Notification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    onPressNotification?.(notification);
  };

  if (isLoading) {
    return (
      <View className="gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState message={t('notifications.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
    );
  }

  if (!visibleNotifications.length) {
    return (
      <EmptyState
        title={t('notifications.empty')}
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
            <Icon name="bell" size={32} color="#F97316" />
          </View>
        }
      />
    );
  }

  return (
    <View className="flex-1 gap-3">
      {showMarkAllRead && unreadCount > 0 && (
        <Pressable
          onPress={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          style={alignInlineEnd}
          className="active:opacity-70"
        >
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {t('notifications.markAllRead')}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={visibleNotifications}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerClassName="gap-3 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={() => handlePress(item)} />
        )}
      />
    </View>
  );
}
