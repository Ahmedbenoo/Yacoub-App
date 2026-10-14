import { useQuery } from '@tanstack/react-query';

import { patientClinicalService } from '@/features/clinical/services/patient-clinical.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useMyLabResultsQuery() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.patients.labResults(userId ?? ''),
    queryFn: () => patientClinicalService.listLabResults(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLabResultDetailQuery(id: string) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.patients.labResultDetail(id),
    queryFn: () => patientClinicalService.getLabResult(userId!, id),
    enabled: Boolean(userId && id),
    staleTime: 1000 * 60 * 10,
  });
}
