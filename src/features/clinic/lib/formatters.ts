import type { Clinic } from '@/shared/types/models';

function localized(locale: string, arabic: string | undefined, fallback: string): string {
  return locale === 'ar' && arabic ? arabic : fallback;
}

export function listingText(value?: string | null): string {
  const text = value?.trim() ?? '';
  if (!text || text === '—' || text === '-') return '';
  return text;
}

export function getClinicName(clinic: Clinic, locale: string): string {
  return localized(locale, clinic.nameAr, clinic.name);
}

export function getClinicDescription(clinic: Clinic, locale: string): string | undefined {
  return localized(locale, clinic.descriptionAr, clinic.description ?? '') || undefined;
}

export function getClinicStreet(clinic: Clinic, locale: string): string {
  return listingText(localized(locale, clinic.address.streetAr, clinic.address.street));
}

export function getClinicAddressLine(clinic: Clinic, locale = 'en'): string {
  const city = listingText(localized(locale, clinic.address.cityAr, clinic.address.city));
  const country = listingText(localized(locale, clinic.address.countryAr, clinic.address.country));
  if (!city) return country;
  if (!country) return city;
  return locale === 'ar' ? `${city}، ${country}` : `${city}, ${country}`;
}
