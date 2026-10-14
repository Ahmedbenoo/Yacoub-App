import { useQuery } from '@tanstack/react-query';

import { patientClinicalService } from '@/features/clinical/services/patient-clinical.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useVisitDetailQuery(id: string) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.patients.visitDetail(id),
    queryFn: () => patientClinicalService.getVisit(userId!, id),
    enabled: Boolean(userId && id),
    staleTime: 1000 * 60 * 10,
  });
}
