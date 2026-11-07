import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  clearActiveRole,
  persistActiveRole,
  resolveActiveRole,
} from '@/shared/lib/active-role';
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '@/shared/lib/storage/secure-storage';
import { UserRole } from '@/shared/types/enums';
import type { AuthSession, User } from '@/shared/types/models';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  ACTIVE_CLINIC: 'active_clinic_id',
} as const;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  activeRole: UserRole | null;
  activeClinicId: string | null;

  setSession: (session: AuthSession) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  setActiveRole: (role: UserRole) => Promise<void>;
  setActiveClinic: (clinicId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  activeRole: null,
  activeClinicId: null,

  setSession: async (session) => {
    await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
    await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);

    const previous = get();
    const sameUser = previous.user?.id === session.user.id;
    const clinicId =
      (sameUser && previous.activeClinicId) || session.user.clinicId || previous.activeClinicId;
    const resolvedUser = { ...session.user, clinicId };

    await setSecureItem(STORAGE_KEYS.USER, JSON.stringify(resolvedUser));
    const activeRole = await resolveActiveRole(resolvedUser);
    if (clinicId) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CLINIC, clinicId);
    }

    set({
      user: resolvedUser,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
      activeRole,
      activeClinicId: clinicId,
    });
  },

  updateUser: async (user) => {
    const previousClinicId = get().activeClinicId;
    const clinicId = user.clinicId || previousClinicId;
    const resolvedUser = { ...user, clinicId };
    await setSecureItem(STORAGE_KEYS.USER, JSON.stringify(resolvedUser));
    const activeRole = await resolveActiveRole(resolvedUser);
    if (clinicId) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CLINIC, clinicId);
    }

    set({
      user: resolvedUser,
      activeRole,
      activeClinicId: clinicId,
      isAuthenticated: true,
    });
  },

  clearSession: async () => {
    await Promise.all([
      deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      deleteSecureItem(STORAGE_KEYS.USER),
      clearActiveRole(),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CLINIC),
    ]);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      activeRole: null,
      activeClinicId: null,
    });
  },

  setActiveRole: async (role) => {
    const { user } = get();
    if (!user?.roles.includes(role)) {
      return;
    }

    await persistActiveRole(role);
    set({ activeRole: role });
  },

  setActiveClinic: async (clinicId) => {
    const { user } = get();
    if (!user) return;

    const updatedUser: User = { ...user, clinicId };
    await Promise.all([
      setSecureItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser)),
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CLINIC, clinicId),
    ]);

    set({
      user: updatedUser,
      activeClinicId: clinicId,
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
        getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
        getSecureItem(STORAGE_KEYS.USER),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as User;
        const activeRole = await resolveActiveRole(user);
        const storedClinicId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CLINIC);
        const activeClinicId = storedClinicId ?? user.clinicId;

        set({
          user: storedClinicId ? { ...user, clinicId: storedClinicId } : user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          activeRole,
          activeClinicId,
        });
      }
    } finally {
      set({ isHydrated: true });
    }
  },

  setHydrated: (value) => set({ isHydrated: value }),
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getActiveClinicId(): string | null {
  return useAuthStore.getState().activeClinicId;
}
