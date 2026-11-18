import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { patientsService } from '@/features/patients/services/patients.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import type { PatientFilters, UpdateHealthProfilePayload } from '@/shared/types/models/patient';

export function usePatientsQuery(filters: PatientFilters = {}) {
  const activeClinicId = useAuthStore((s) => s.activeClinicId) ?? undefined;
  const scopedFilters: PatientFilters = {
    ...filters,
    clinicId: filters.clinicId ?? activeClinicId,
  };

  return useQuery({
    queryKey: queryKeys.patients.list(scopedFilters as Record<string, unknown>),
    queryFn: () => patientsService.list(scopedFilters),
    enabled: Boolean(scopedFilters.clinicId),
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

export function useUpdateHealthProfileMutation(patientId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: (payload: UpdateHealthProfilePayload) =>
      patientsService.updateHealthProfile(patientId, payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.patients.detail(patientId), profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      Toast.show({ type: 'success', text1: t('toast.healthProfileSaved') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useReplyPatientDocumentMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, message }: { documentId: string; message: string }) =>
      patientsService.replyDocument(patientId, documentId, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients.history(patientId) });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: normalizeApiError(error).message });
    },
  });
}
