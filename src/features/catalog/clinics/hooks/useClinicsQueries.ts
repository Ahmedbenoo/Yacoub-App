import { useQuery } from '@tanstack/react-query';

import { clinicsService } from '@/features/clinic/services/clinics.service';
import { queryKeys } from '@/shared/api/query-keys';
import type { ClinicFilters } from '@/shared/types/models';

export function useClinicsSearchQuery(filters: ClinicFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clinics.search(filters as Record<string, unknown>),
    queryFn: () => clinicsService.search(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useClinicDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clinics.detail(id),
    queryFn: () => clinicsService.getById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
}

export function useClinicCities() {
  return useQuery({
    queryKey: queryKeys.clinics.search({ cities: true }),
    queryFn: () => clinicsService.getCities(),
    staleTime: 1000 * 60 * 10,
  });
}
