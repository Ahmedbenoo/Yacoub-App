import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatSpecialty } from '@/features/patient/lib/formatters';
import {
  CLINIC_SPECIALTIES,
  CORE_SPECIALTY_IDS,
  HOME_VISIT_SPECIALTY_IDS,
} from '@/shared/catalog/clinic-specialties';
import type { SelectOption } from '@/shared/components/form/Select';
import { useLocaleStore } from '@/shared/stores';

export function useSpecialtyOptions() {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);

  return useMemo(
    () =>
      CLINIC_SPECIALTIES.map((specialty) => ({
        value: specialty.nameEn,
        label: formatSpecialty(specialty.nameEn, t),
      })).sort((a, b) => a.label.localeCompare(b.label, locale)),
    [locale, t],
  );
}

export function useHomeVisitSpecialtyOptions(): SelectOption[] {
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);

  return useMemo(() => {
    const open = HOME_VISIT_SPECIALTY_IDS.map((id) => {
      const specialty = CLINIC_SPECIALTIES.find((item) => item.id === id);
      if (!specialty) return null;
      return {
        value: specialty.nameEn,
        label: formatSpecialty(specialty.nameEn, t),
      };
    }).filter((item): item is SelectOption => Boolean(item));

    const soon = CORE_SPECIALTY_IDS.filter(
      (id) => !(HOME_VISIT_SPECIALTY_IDS as readonly string[]).includes(id),
    )
      .map((id) => CLINIC_SPECIALTIES.find((item) => item.id === id))
      .filter((specialty): specialty is NonNullable<typeof specialty> => Boolean(specialty))
      .map((specialty) => ({
        value: specialty.nameEn,
        label: `${formatSpecialty(specialty.nameEn, t)} — ${tc('comingSoon')}`,
        disabled: true,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));

    return [...open, ...soon];
  }, [locale, t, tc]);
}
