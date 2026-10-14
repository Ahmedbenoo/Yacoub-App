import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthFlowState {
  resetEmail: string | null;
  resetToken: string | null;
  setResetEmail: (email: string) => void;
  setResetToken: (token: string) => void;
  clearResetFlow: () => void;
}

export const useAuthFlowStore = create<AuthFlowState>()(
  persist(
    (set) => ({
      resetEmail: null,
      resetToken: null,
      setResetEmail: (email) => set({ resetEmail: email.toLowerCase() }),
      setResetToken: (token) => set({ resetToken: token }),
      clearResetFlow: () => set({ resetEmail: null, resetToken: null }),
    }),
    {
      name: 'auth-flow-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
