import { useQuery } from '@tanstack/react-query';

import { patientClinicalService } from '@/features/clinical/services/patient-clinical.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useMyPrescriptionsQuery() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.patients.prescriptions(userId ?? ''),
    queryFn: () => patientClinicalService.listPrescriptions(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePrescriptionDetailQuery(id: string) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.patients.prescriptionDetail(id),
    queryFn: () => patientClinicalService.getPrescription(userId!, id),
    enabled: Boolean(userId && id),
    staleTime: 0,
  });
}
