import AsyncStorage from '@react-native-async-storage/async-storage';

import { authService } from '@/features/auth/services/auth.service';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { queryKeys } from '@/shared/api/query-keys';
import { resolveActiveRole } from '@/shared/lib/active-role';
import { queryClient } from '@/shared/lib/query-client';
import { setSecureItem } from '@/shared/lib/storage/secure-storage';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { UserRole } from '@/shared/types/enums';

export {
  clearActiveRole,
  persistActiveRole,
  resolveActiveRole,
} from '@/shared/lib/active-role';

export async function resolveSessionClinicId(
  userId: string,
  role: UserRole | null,
  preferredClinicId: string | null,
  fallbackClinicId: string,
): Promise<string> {
  const clinics = await clinicsService.listForUser(userId, role);
  if (preferredClinicId && clinics.some((clinic) => clinic.id === preferredClinicId)) {
    return preferredClinicId;
  }
  return clinics[0]?.id ?? fallbackClinicId;
}

export async function validateSession(): Promise<boolean> {
  const { isAuthenticated, clearSession } = useAuthStore.getState();

  if (!isAuthenticated) {
    return false;
  }

  try {
    const user = await authService.getMe();
    const activeRole = await resolveActiveRole(user);
    const { activeClinicId } = useAuthStore.getState();
    const clinicId = await resolveSessionClinicId(user.id, activeRole, activeClinicId, user.clinicId);
    const resolvedUser = { ...user, clinicId };

    useAuthStore.setState({
      user: resolvedUser,
      activeRole,
      activeClinicId: clinicId,
      isAuthenticated: true,
    });

    await setSecureItem('user', JSON.stringify(resolvedUser));
    await AsyncStorage.setItem('active_clinic_id', clinicId);
    queryClient.setQueryData(queryKeys.auth.me, resolvedUser);
    return true;
  } catch {
    await clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    return false;
  }
}
