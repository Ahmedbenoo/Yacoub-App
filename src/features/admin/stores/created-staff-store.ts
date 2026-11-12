import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SecretaryProfile } from '@/shared/types/models/admin';

interface CreatedStaffState {
  secretaries: SecretaryProfile[];
  rememberSecretary: (secretary: SecretaryProfile) => void;
  forgetSecretary: (id: string) => void;
}

function phoneKey(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 11) return digits.slice(2);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function sameSecretary(a: SecretaryProfile, b: SecretaryProfile) {
  if (a.userId && b.userId && a.userId === b.userId) return true;
  if (a.id && b.id && a.id === b.id) return true;
  const left = phoneKey(a.phone);
  const right = phoneKey(b.phone);
  return Boolean(left && right && left === right);
}

function mergeSecretaries(current: SecretaryProfile[], next: SecretaryProfile) {
  return [next, ...current.filter((item) => !sameSecretary(item, next))];
}

export const useCreatedStaffStore = create<CreatedStaffState>()(
  persist(
    (set, get) => ({
      secretaries: [],
      rememberSecretary: (secretary) =>
        set({ secretaries: mergeSecretaries(get().secretaries, secretary) }),
      forgetSecretary: (id) =>
        set({ secretaries: get().secretaries.filter((item) => !matchesSecretaryId(item, id)) }),
    }),
    {
      name: 'created-staff-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function mergeSecretaryLists(remote: SecretaryProfile[], local: SecretaryProfile[]) {
  return local.reduce((list, item) => mergeSecretaries(list, item), remote);
}

export function matchesSecretaryId(secretary: SecretaryProfile, id: string) {
  return secretary.userId === id || secretary.id === id || secretary.id.startsWith(`${id}:`);
}

export function findRememberedSecretary(id: string) {
  return useCreatedStaffStore.getState().secretaries.find((item) => matchesSecretaryId(item, id));
}
