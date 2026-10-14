import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyRtl, initI18n } from '@/shared/i18n';
import { Locale, ThemeMode } from '@/shared/types/enums';

export {
  getActiveClinicId,
  getAuthToken,
  useAuthStore,
} from '@/shared/stores/auth-store';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: ThemeMode.LIGHT,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      skipHydration: true,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const stored = persistedState as { mode?: ThemeMode };
          if (!stored?.mode || stored.mode === ThemeMode.SYSTEM) {
            return { ...stored, mode: ThemeMode.LIGHT };
          }
        }

        return persistedState;
      },
    },
  ),
);

interface LocaleState {
  locale: Locale;
  isRtl: boolean;
  localeChosenByUser: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

function resolveLocale(locale: Locale, localeChosenByUser: boolean): Locale {
  return localeChosenByUser ? locale : Locale.AR;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: Locale.AR,
      isRtl: true,
      localeChosenByUser: false,

      setLocale: async (locale) => {
        initI18n(locale);
        set({
          locale,
          isRtl: locale === Locale.AR,
          localeChosenByUser: true,
        });
        await applyRtl(locale);
      },

      hydrate: async () => {
        const { locale, localeChosenByUser } = get();
        const effectiveLocale = resolveLocale(locale, localeChosenByUser);

        initI18n(effectiveLocale);
        await applyRtl(effectiveLocale);
        set({
          locale: effectiveLocale,
          isRtl: effectiveLocale === Locale.AR,
        });
      },
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      skipHydration: true,
      migrate: (persistedState, version) => {
        if (version < 3) {
          const stored = persistedState as {
            state?: { locale?: Locale; isRtl?: boolean; localeChosenByUser?: boolean };
          };

          return {
            ...stored,
            state: {
              ...stored?.state,
              locale: Locale.AR,
              isRtl: true,
              localeChosenByUser: false,
            },
          };
        }

        return persistedState;
      },
    },
  ),
);

interface AppState {
  onboardingCompleted: boolean;
  setOnboardingCompleted: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      setOnboardingCompleted: (value) => set({ onboardingCompleted: value }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
