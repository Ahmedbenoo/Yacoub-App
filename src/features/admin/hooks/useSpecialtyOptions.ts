import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatSpecialty } from '@/features/patient/lib/formatters';
import { CLINIC_SPECIALTIES } from '@/shared/catalog/clinic-specialties';
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
