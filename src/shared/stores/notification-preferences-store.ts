import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { NotificationType } from '@/shared/types/enums';

type CategoryPreferences = Record<NotificationType, boolean>;

const DEFAULT_PREFERENCES: CategoryPreferences = {
  [NotificationType.APPOINTMENT]: true,
  [NotificationType.PRESCRIPTION]: true,
  [NotificationType.LAB_RESULT]: true,
  [NotificationType.SYSTEM]: true,
};

interface NotificationPreferencesState {
  categories: CategoryPreferences;
  setCategoryEnabled: (type: NotificationType, enabled: boolean) => void;
  isCategoryEnabled: (type: NotificationType) => boolean;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_PREFERENCES,

      setCategoryEnabled: (type, enabled) =>
        set((state) => ({
          categories: { ...state.categories, [type]: enabled },
        })),

      isCategoryEnabled: (type) => get().categories[type] ?? true,
    }),
    {
      name: 'notification-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
