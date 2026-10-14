import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerPushToken,
} from '@/shared/lib/push-notifications';
import { queryClient } from '@/shared/lib/query-client';
import { queryKeys } from '@/shared/api/query-keys';
import { getAppointmentHref } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';

export function usePushNotificationsSetup() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!isAuthenticated || !userId || Platform.OS === 'web') return;

    registerPushToken(userId);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    const receivedSub = addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    });

    const responseSub = addNotificationResponseListener((response) => {
      const appointmentId = response.notification.request.content.data?.appointmentId;
      const role = useAuthStore.getState().activeRole;

      if (typeof appointmentId === 'string' && role) {
        router.push(getAppointmentHref(role, appointmentId), { withAnchor: true });
      }
    });

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);
}
