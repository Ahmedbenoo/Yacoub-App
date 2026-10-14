import { useEffect } from 'react';

import { useAuthMeQuery } from '@/features/auth/hooks/useAuthQueries';
import { resolveSessionClinicId } from '@/features/auth/lib/session';
import { useAuthStore } from '@/shared/stores';

export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);

  const { data, isLoading, isError, refetch, isFetching } = useAuthMeQuery();

  useEffect(() => {
    if (!data) return;

    let cancelled = false;

    void (async () => {
      const state = useAuthStore.getState();
      const clinicId = await resolveSessionClinicId(
        data.id,
        state.activeRole,
        state.activeClinicId,
        data.clinicId,
      );
      if (cancelled) return;
      await updateUser({ ...data, clinicId });
    })();

    return () => {
      cancelled = true;
    };
  }, [data, updateUser]);

  return {
    user: data ?? user,
    isLoading: isAuthenticated && (isLoading || isFetching),
    isError,
    refetch,
  };
}
