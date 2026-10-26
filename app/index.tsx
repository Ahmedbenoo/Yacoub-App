import { useEffect } from 'react';
import { router } from 'expo-router';

import { AppSplash } from '@/shared/components/brand/AppSplash';

import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { useAuthStore } from '@/shared/stores';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeRole = useAuthStore((s) => s.activeRole);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (!activeRole && user && user.roles.length > 1) {
      router.replace('/(auth)/role-selection');
      return;
    }

    if (user) {
      void resolvePostAuthNavigation(user);
      return;
    }

    router.replace('/(auth)/login');
  }, [isHydrated, isAuthenticated, activeRole, user]);

  return <AppSplash />;
}
