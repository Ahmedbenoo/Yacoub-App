import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { patientRecordsService } from '@/features/patients/services/patient-records.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { UpdateHealthProfilePayload, UploadMedicalDocumentPayload } from '@/shared/types/models/patient';

function usePatientUserId() {
  const userId = useAuthStore((s) => s.user?.id);
  const activeRole = useAuthStore((s) => s.activeRole);
  return activeRole === UserRole.PATIENT ? userId : undefined;
}

export function useMyPatientProfileQuery() {
  const userId = usePatientUserId();

  return useQuery({
    queryKey: queryKeys.patients.me(),
    queryFn: () => patientRecordsService.getMyProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyMedicalHistoryQuery() {
  const userId = usePatientUserId();

  return useQuery({
    queryKey: queryKeys.patients.history('me'),
    queryFn: () => patientRecordsService.getMyHistory(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateMyHealthProfileMutation() {
  const userId = usePatientUserId();
  const queryClient = useQueryClient();
  const { t } = useTranslation('patient');

  return useMutation({
    mutationFn: (payload: UpdateHealthProfilePayload) =>
      patientRecordsService.updateMyHealthProfile(userId!, payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.patients.me(), profile);
      Toast.show({ type: 'success', text1: t('profile.saved') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: normalizeApiError(error).message });
    },
  });
}

export function useMyVisitLinksQuery(enabled = true) {
  const userId = usePatientUserId();

  return useQuery({
    queryKey: queryKeys.patients.visitLinks(),
    queryFn: () => patientRecordsService.listVisitLinks(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUploadMedicalDocumentMutation() {
  const userId = usePatientUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadMedicalDocumentPayload) =>
      patientRecordsService.uploadDocument(userId!, payload),
    onSuccess: (_data, payload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients.history('me') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      if (payload.visitId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.patients.visitDetail(payload.visitId) });
      }
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: normalizeApiError(error).message });
    },
  });
}
