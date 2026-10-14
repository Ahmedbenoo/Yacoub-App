import { useTranslation } from 'react-i18next';

import { CLINIC_BRANCHES } from '@/features/admin/lib/branches';

export function useBranchOptions() {
  const { t } = useTranslation('admin');

  return CLINIC_BRANCHES.map((branch) => ({
    value: branch.id,
    label: t(branch.labelKey),
  }));
}
