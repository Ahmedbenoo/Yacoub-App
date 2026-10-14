import { I18nManager, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { Locale } from '@/shared/types/enums';

import arAdmin from './locales/ar/admin.json';
import arAppointments from './locales/ar/appointments.json';
import arAuth from './locales/ar/auth.json';
import arClinic from './locales/ar/clinic.json';
import arCommon from './locales/ar/common.json';
import arDoctor from './locales/ar/doctor.json';
import arHomeVisit from './locales/ar/homeVisit.json';
import arNursing from './locales/ar/nursing.json';
import arPatient from './locales/ar/patient.json';
import arSecretary from './locales/ar/secretary.json';
import arValidation from './locales/ar/validation.json';
import enAdmin from './locales/en/admin.json';
import enAppointments from './locales/en/appointments.json';
import enAuth from './locales/en/auth.json';
import enClinic from './locales/en/clinic.json';
import enCommon from './locales/en/common.json';
import enDoctor from './locales/en/doctor.json';
import enHomeVisit from './locales/en/homeVisit.json';
import enNursing from './locales/en/nursing.json';
import enPatient from './locales/en/patient.json';
import enSecretary from './locales/en/secretary.json';
import enValidation from './locales/en/validation.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    clinic: enClinic,
    doctor: enDoctor,
    patient: enPatient,
    homeVisit: enHomeVisit,
    nursing: enNursing,
    secretary: enSecretary,
    admin: enAdmin,
    validation: enValidation,
    appointments: enAppointments,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    clinic: arClinic,
    doctor: arDoctor,
    patient: arPatient,
    homeVisit: arHomeVisit,
    nursing: arNursing,
    secretary: arSecretary,
    admin: arAdmin,
    validation: arValidation,
    appointments: arAppointments,
  },
};

function getDeviceLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'ar';
  return deviceLocale === 'en' ? Locale.EN : Locale.AR;
}

export function initI18n(locale: Locale = Locale.AR) {
  const lng = locale;

  const namespaces = ['common', 'auth', 'clinic', 'doctor', 'patient', 'secretary', 'admin', 'validation', 'appointments', 'nursing', 'homeVisit'] as const;

  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: Locale.AR,
      defaultNS: 'common',
      ns: [...namespaces],
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else {
    for (const [language, bundles] of Object.entries(resources)) {
      for (const namespace of namespaces) {
        i18n.addResourceBundle(language, namespace, bundles[namespace], true, true);
      }
    }
    void i18n.changeLanguage(lng);
  }

  return i18n;
}

initI18n(Locale.AR);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

export { i18n, getDeviceLocale };

export function isRtlLocale(locale: Locale): boolean {
  return locale === Locale.AR;
}

const RTL_RELOAD_LOCK = 'clinify.rtl-reload-lock';

export async function applyRtl(locale: Locale): Promise<boolean> {
  const shouldBeRtl = isRtlLocale(locale);
  const needsReload = I18nManager.isRTL !== shouldBeRtl;

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldBeRtl);
  if (typeof I18nManager.swapLeftAndRightInRTL === 'function') {
    I18nManager.swapLeftAndRightInRTL(true);
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = shouldBeRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    return false;
  }

  if (needsReload) {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const lock = shouldBeRtl ? 'rtl' : 'ltr';
    const previous = await AsyncStorage.getItem(RTL_RELOAD_LOCK);
    if (previous !== lock) {
      await AsyncStorage.setItem(RTL_RELOAD_LOCK, lock);
      void reloadNativeApp();
    }
  }

  return needsReload;
}

async function reloadNativeApp() {
  try {
    const expo = await import('expo');
    const reload = (expo as { reloadAppAsync?: () => Promise<void> }).reloadAppAsync;
    if (typeof reload === 'function') {
      await reload();
    }
  } catch {
    // Reload may be unavailable in some native builds; JS layout fallbacks still apply.
  }
}
