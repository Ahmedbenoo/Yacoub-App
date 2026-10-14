import { useQuery } from '@tanstack/react-query';

import { doctorsService } from '@/features/catalog/doctors/services/doctors.service';
import { patientsService } from '@/features/patients/services/patients.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import type { DoctorFilters } from '@/shared/types/models/doctor';
import type { PatientFilters } from '@/shared/types/models/patient';

export function useAdminDoctorsQuery(filters: DoctorFilters = {}) {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? undefined;
  const scopedFilters: DoctorFilters = filters.allClinics
    ? { ...filters, clinicId: undefined }
    : {
        ...filters,
        clinicId: filters.clinicId ?? activeClinicId,
      };

  return useQuery({
    queryKey: queryKeys.doctors.list(scopedFilters as Record<string, unknown>),
    queryFn: () => doctorsService.list(scopedFilters),
    enabled: Boolean(scopedFilters.allClinics || scopedFilters.clinicId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminPatientsQuery(filters: PatientFilters = {}) {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? undefined;
  const scopedFilters: PatientFilters = {
    ...filters,
    clinicId: filters.clinicId ?? activeClinicId,
  };

  return useQuery({
    queryKey: queryKeys.patients.list(scopedFilters as Record<string, unknown>),
    queryFn: () => patientsService.list(scopedFilters),
    enabled: Boolean(scopedFilters.clinicId),
    staleTime: 1000 * 60 * 5,
  });
}
