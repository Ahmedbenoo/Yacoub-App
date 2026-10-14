import { useQuery } from '@tanstack/react-query';

import { adminService } from '@/features/admin/services/admin.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function useClinicStatsQuery() {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? '';

  return useQuery({
    queryKey: queryKeys.admin.stats(activeClinicId),
    queryFn: () => adminService.getStats(activeClinicId),
    enabled: Boolean(activeClinicId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useClinicReportsQuery() {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? '';

  return useQuery({
    queryKey: queryKeys.admin.reports(activeClinicId),
    queryFn: () => adminService.getReports(activeClinicId),
    enabled: Boolean(activeClinicId),
    staleTime: 1000 * 60 * 10,
  });
}

export function useClinicReportDetailQuery(id: string) {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? '';

  return useQuery({
    queryKey: queryKeys.admin.reportDetail(activeClinicId, id),
    queryFn: () => adminService.getReportById(id, activeClinicId),
    enabled: Boolean(activeClinicId && id),
    staleTime: 1000 * 60 * 10,
  });
}
