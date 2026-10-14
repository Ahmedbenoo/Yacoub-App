import { getActiveClinicId } from '@/shared/stores/auth-store';

import { DEFAULT_MOCK_CLINIC_ID } from './constants';

export function getMockClinicScope(clinicId?: string): string {
  return clinicId ?? getActiveClinicId() ?? DEFAULT_MOCK_CLINIC_ID;
}

export function matchesMockClinic(
  itemClinicId: string,
  options: { clinicId?: string; allClinics?: boolean } = {},
): boolean {
  if (options.allClinics && !options.clinicId) {
    return true;
  }

  const scope = getMockClinicScope(options.clinicId);
  return itemClinicId === scope;
}
