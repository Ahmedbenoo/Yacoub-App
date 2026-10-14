import { useQuery } from '@tanstack/react-query';

import { clinicalService } from '@/features/clinical/services/clinical.service';
import { queryKeys } from '@/shared/api/query-keys';

export function useStaffPrescriptionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clinical.prescription(id),
    queryFn: () => clinicalService.getPrescription(id),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export function useStaffLabResultQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clinical.labResult(id),
    queryFn: () => clinicalService.getLabResult(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
}

export function useStaffVisitQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clinical.visit(id),
    queryFn: () => clinicalService.getVisit(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
}
