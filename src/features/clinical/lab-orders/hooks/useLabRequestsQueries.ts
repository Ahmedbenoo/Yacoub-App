import { useQuery } from '@tanstack/react-query';

import { labRequestsService } from '@/features/clinical/lab-orders/services/lab-requests.service';
import { queryKeys } from '@/shared/api/query-keys';

export function useLabRequestsQuery(visitId: string) {
  return useQuery({
    queryKey: queryKeys.labRequests.byVisit(visitId),
    queryFn: () => labRequestsService.byVisit(visitId),
    enabled: Boolean(visitId),
  });
}
