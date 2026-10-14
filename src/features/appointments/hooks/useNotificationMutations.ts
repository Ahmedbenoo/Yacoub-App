import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsService } from '@/features/appointments/services/notifications.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markRead(notificationId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: () => notificationsService.markAllRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
