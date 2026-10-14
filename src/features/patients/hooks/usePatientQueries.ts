import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { patientsService } from '@/features/patients/services/patients.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { PatientFilters } from '@/shared/types/models/patient';

export function usePatientsQuery(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: queryKeys.patients.list(filters as Record<string, unknown>),
    queryFn: () => patientsService.list(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePatientDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => patientsService.getById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePatientHistoryQuery(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patients.history(patientId),
    queryFn: () => patientsService.getHistory(patientId),
    enabled: Boolean(patientId),
    staleTime: 1000 * 60 * 2,
  });
}
