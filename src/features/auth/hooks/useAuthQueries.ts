import { useQuery } from '@tanstack/react-query';

import { authService } from '@/features/auth/services/auth.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useAuthMeQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authService.getMe(),
    enabled: isHydrated && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
