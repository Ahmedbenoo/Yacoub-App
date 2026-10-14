import type { TFunction } from 'i18next';

import type { NotificationType } from '@/shared/types/enums';
import type { Notification } from '@/shared/types/models/notification';

export function filterNotificationsByPreferences(
  notifications: Notification[],
  isCategoryEnabled: (type: NotificationType) => boolean,
): Notification[] {
  return notifications.filter((notification) => isCategoryEnabled(notification.type));
}

export function getNotificationCopy(
  notification: Notification,
  t: TFunction<'appointments'>,
): { title: string; body: string } {
  if (!notification.messageKey) {
    return { title: notification.title, body: notification.body };
  }

  const params = (notification.data ?? {}) as Record<string, string>;
  return {
    title: t(`notifications.items.${notification.messageKey}.title`, params),
    body: t(`notifications.items.${notification.messageKey}.body`, params),
  };
}
