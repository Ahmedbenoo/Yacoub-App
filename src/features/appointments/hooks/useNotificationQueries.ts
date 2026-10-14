import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { notificationsService } from '@/features/appointments/services/notifications.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useNotificationsQuery(limit?: number) {
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: [...queryKeys.notifications.list(), userId],
    queryFn: () => notificationsService.list(userId!),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const data = useMemo(() => {
    if (!query.data || typeof limit !== 'number') return query.data;
    return { ...query.data, data: query.data.data.slice(0, limit) };
  }, [limit, query.data]);

  return { ...query, data };
}

export function useUnreadNotificationsCount() {
  const { data } = useNotificationsQuery();
  return data?.data.filter((item) => !item.readAt).length ?? 0;
}
