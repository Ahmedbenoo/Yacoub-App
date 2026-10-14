import { router } from 'expo-router';

import { clinicsService } from '@/features/clinic/services/clinics.service';
import { getHomeRouteForRole } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { User } from '@/shared/types/models';

export async function resolvePostAuthNavigation(user: User): Promise<void> {
  const { activeRole, activeClinicId } = useAuthStore.getState();

  if (user.roles.length > 1 && !activeRole) {
    router.replace('/(auth)/role-selection');
    return;
  }

  const role = activeRole;
  if (!role) {
    router.replace('/(auth)/login');
    return;
  }

  if (role === UserRole.NURSE || role === UserRole.NURSING_ADMIN) {
    router.replace(getHomeRouteForRole(role) as never);
    return;
  }

  const clinics = await clinicsService.listForUser(user.id, role);
  const hasValidClinic = activeClinicId && clinics.some((clinic) => clinic.id === activeClinicId);

  if (clinics.length > 1 && !hasValidClinic) {
    router.replace('/(auth)/clinic-selection');
    return;
  }

  if (clinics.length === 1 && !hasValidClinic) {
    await useAuthStore.getState().setActiveClinic(clinics[0].id);
  }

  router.replace(getHomeRouteForRole(role) as never);
}

export function userNeedsClinicSelection(clinicCount: number, activeClinicId: string | null, clinicIds: string[]): boolean {
  if (clinicCount <= 1) return false;
  return !activeClinicId || !clinicIds.includes(activeClinicId);
}
