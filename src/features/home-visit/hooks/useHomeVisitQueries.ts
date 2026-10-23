import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { homeVisitService } from '@/features/home-visit/services/home-visit.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { AcceptHomeVisitPayload, CreateHomeVisitPayload } from '@/shared/types/models/home-visit';

function useInvalidateHomeVisits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.homeVisits.all });
}

export function usePatientHomeVisitsQuery(patientUserId?: string) {
  return useQuery({
    queryKey: queryKeys.homeVisits.list(`patient:${patientUserId ?? ''}`),
    queryFn: () => homeVisitService.listForPatient(patientUserId!),
    enabled: Boolean(patientUserId),
  });
}

export function useHomeVisitSettingQuery() {
  return useQuery({
    queryKey: queryKeys.homeVisits.setting,
    queryFn: () => homeVisitService.setting(),
  });
}

export function useEnableHomeVisitsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => homeVisitService.enable(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.homeVisits.setting });
    },
  });
}

export function useDoctorHomeVisitsQuery(doctorId?: string) {
  return useQuery({
    queryKey: queryKeys.homeVisits.list(`doctor:${doctorId ?? ''}`),
    queryFn: () => homeVisitService.listForDoctor(doctorId!),
    enabled: Boolean(doctorId),
  });
}

export function useHomeVisitQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.homeVisits.detail(id),
    queryFn: () => homeVisitService.getRequest(id),
    enabled: Boolean(id),
  });
}

export function useCreateHomeVisitMutation() {
  const invalidate = useInvalidateHomeVisits();
  const { t } = useTranslation('homeVisit');

  return useMutation({
    mutationFn: (payload: CreateHomeVisitPayload) => homeVisitService.createRequest(payload),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.requested') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useAcceptHomeVisitMutation() {
  const invalidate = useInvalidateHomeVisits();
  const { t } = useTranslation('homeVisit');

  return useMutation({
    mutationFn: ({ id, ...payload }: AcceptHomeVisitPayload & { id: string }) => homeVisitService.accept(id, payload),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.accepted') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useCompleteHomeVisitMutation() {
  const invalidate = useInvalidateHomeVisits();
  const { t } = useTranslation('homeVisit');

  return useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId: string }) => homeVisitService.complete(id, doctorId),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.completed') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}
