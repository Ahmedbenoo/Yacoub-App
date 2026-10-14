import { useQuery } from '@tanstack/react-query';

import { doctorsService } from '@/features/catalog/doctors/services/doctors.service';
import { queryKeys } from '@/shared/api/query-keys';
import type { DoctorFilters } from '@/shared/types/models/doctor';

export function useDoctorsQuery(filters: DoctorFilters = {}) {
  const scopedFilters = { allClinics: true, ...filters };

  return useQuery({
    queryKey: queryKeys.doctors.list(scopedFilters as Record<string, unknown>),
    queryFn: () => doctorsService.list(scopedFilters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDoctorDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => doctorsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useDoctorAvailabilityQuery(doctorId: string) {
  return useQuery({
    queryKey: queryKeys.doctors.availability(doctorId),
    queryFn: () => doctorsService.getAvailability(doctorId),
    enabled: Boolean(doctorId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDoctorSpecialties() {
  return doctorsService.getSpecialties();
}
