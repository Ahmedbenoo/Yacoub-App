import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '@/shared/lib/storage/secure-storage';
import { UserRole } from '@/shared/types/enums';
import type { User } from '@/shared/types/models';

const ACTIVE_ROLE_KEY = 'active_role';

export async function resolveActiveRole(user: User): Promise<UserRole | null> {
  if (user.roles.length === 1) {
    return user.roles[0];
  }

  const storedRole = await getSecureItem(ACTIVE_ROLE_KEY);
  if (storedRole && user.roles.includes(storedRole as UserRole)) {
    return storedRole as UserRole;
  }

  return null;
}

export async function persistActiveRole(role: UserRole): Promise<void> {
  await setSecureItem(ACTIVE_ROLE_KEY, role);
}

export async function clearActiveRole(): Promise<void> {
  await deleteSecureItem(ACTIVE_ROLE_KEY);
}
