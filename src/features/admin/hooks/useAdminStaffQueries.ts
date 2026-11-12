import { useQuery, useQueryClient } from '@tanstack/react-query';

import { adminService } from '@/features/admin/services/admin.service';
import { matchesSecretaryId } from '@/features/admin/stores/created-staff-store';
import { doctorsService } from '@/features/catalog/doctors/services/doctors.service';
import { patientsService } from '@/features/patients/services/patients.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import type { SecretaryProfile } from '@/shared/types/models/admin';
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

export function useAdminSecretariesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.secretaries(),
    queryFn: () => adminService.listSecretaries(),
    staleTime: 1000 * 30,
    refetchOnMount: 'always',
    placeholderData: (previous) => previous,
  });
}

export function useAdminSecretaryQuery(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.admin.secretary(id),
    queryFn: async () => {
      try {
        return await adminService.getSecretary(id);
      } catch (error) {
        const cached = queryClient
          .getQueryData<SecretaryProfile[]>(queryKeys.admin.secretaries())
          ?.find((item) => matchesSecretaryId(item, id));
        if (cached) return cached;
        throw error;
      }
    },
    enabled: Boolean(id),
    initialData: () =>
      queryClient
        .getQueryData<SecretaryProfile[]>(queryKeys.admin.secretaries())
        ?.find((item) => matchesSecretaryId(item, id)),
    staleTime: 1000 * 30,
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
