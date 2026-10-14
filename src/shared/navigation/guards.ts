import { useEffect } from 'react';
import { router } from 'expo-router';

import { getHomeRouteForRole } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

export function useAuthGuard(requiredRole?: UserRole) {
  const { isAuthenticated, isHydrated, activeRole } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (requiredRole && activeRole && activeRole !== requiredRole) {
      router.replace(getHomeRouteForRole(activeRole) as never);
    }
  }, [isAuthenticated, isHydrated, activeRole, requiredRole]);
}

export function usePatientAreaGuard() {
  const { isAuthenticated, isHydrated, activeRole } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && activeRole && activeRole !== UserRole.PATIENT) {
      router.replace(getHomeRouteForRole(activeRole) as never);
    }
  }, [isAuthenticated, isHydrated, activeRole]);
}

export function useGuestGuard() {
  const { isAuthenticated, isHydrated, activeRole } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && activeRole) {
      router.replace(getHomeRouteForRole(activeRole) as never);
    } else if (isAuthenticated && !activeRole) {
      router.replace('/(auth)/role-selection');
    }
  }, [isAuthenticated, isHydrated, activeRole]);
}

export function useRequireAuth() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isHydrated]);

  return { isAuthenticated, isHydrated };
}
