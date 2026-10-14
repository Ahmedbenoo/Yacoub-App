import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { env } from '@/config/env';
import { captureException } from '@/shared/lib/monitoring';
import { useNotificationPreferencesStore } from '@/shared/stores/notification-preferences-store';
import { NotificationType } from '@/shared/types/enums';

try {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const rawType = notification.request.content.data?.type;
      const type =
        typeof rawType === 'string' && Object.values(NotificationType).includes(rawType as NotificationType)
          ? (rawType as NotificationType)
          : undefined;
      const enabled = type
        ? useNotificationPreferencesStore.getState().isCategoryEnabled(type)
        : true;

      return {
        shouldShowAlert: enabled,
        shouldPlaySound: enabled,
        shouldSetBadge: enabled,
        shouldShowBanner: enabled,
        shouldShowList: enabled,
      };
    },
  });
} catch (error) {
  captureException(error, { scope: 'notification-handler' });
}

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return 'unsupported';
  }

  const { status } = await Notifications.getPermissionsAsync();

  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return 'unsupported';
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;

  if (current.status !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    return 'denied';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Yacoub',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  try {
    const status = await requestPushPermissions();
    if (status !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    captureException(error, { scope: 'push-token' });
    return null;
  }
}

export async function registerPushToken(userId: string): Promise<string | null> {
  const token = await getExpoPushToken();
  if (!token) return null;

  if (env.useMockApi) {
    console.info('[push] Registered mock device token for user', userId);
    return token;
  }

  // Real API: POST /devices/register { token, platform }
  return token;
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  try {
    return Notifications.addNotificationReceivedListener(listener);
  } catch (error) {
    captureException(error, { scope: 'notification-received-listener' });
    return { remove() {} };
  }
}

export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  try {
    return Notifications.addNotificationResponseReceivedListener(listener);
  } catch (error) {
    captureException(error, { scope: 'notification-response-listener' });
    return { remove() {} };
  }
}
