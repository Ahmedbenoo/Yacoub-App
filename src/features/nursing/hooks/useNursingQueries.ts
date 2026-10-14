import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { nursingService } from '@/features/nursing/services/nursing.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { NurseVerification } from '@/shared/types/enums';
import type { CreateHomeNursingRequestPayload } from '@/shared/types/models/nursing';

function useInvalidateNursing() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.nursing.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ]);
}

export function usePatientNursingRequestsQuery(patientUserId?: string) {
  return useQuery({
    queryKey: queryKeys.nursing.list(`patient:${patientUserId ?? ''}`),
    queryFn: () => nursingService.listForPatient(patientUserId!),
    enabled: Boolean(patientUserId),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useAdminNursingRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.nursing.list('admin'),
    queryFn: () => nursingService.listForAdmin(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useNurseNursingRequestsQuery(nurseUserId?: string) {
  return useQuery({
    queryKey: queryKeys.nursing.list(`nurse:${nurseUserId ?? ''}`),
    queryFn: () => nursingService.listForNurse(nurseUserId!),
    enabled: Boolean(nurseUserId),
  });
}

export function useNursingRequestQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.nursing.detail(id),
    queryFn: () => nursingService.getRequest(id),
    enabled: Boolean(id),
  });
}

export function useNursesQuery() {
  return useQuery({
    queryKey: queryKeys.nursing.nurses(),
    queryFn: () => nursingService.listNurses(),
  });
}

export function useNurseProfileQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.nursing.nurse(userId ?? ''),
    queryFn: () => nursingService.getNurse(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateNursingRequestMutation() {
  const invalidate = useInvalidateNursing();
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: (payload: CreateHomeNursingRequestPayload) => nursingService.createRequest(payload),
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

export function usePriceNursingRequestMutation() {
  const invalidate = useInvalidateNursing();
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => nursingService.priceAndNotify(id, price),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.priced') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useAssignNurseMutation() {
  const invalidate = useInvalidateNursing();
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: ({ id, nurseUserId }: { id: string; nurseUserId: string }) =>
      nursingService.assignNurse(id, nurseUserId),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.assigned') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useNurseRespondMutation() {
  const invalidate = useInvalidateNursing();
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: ({
      id,
      nurseUserId,
      action,
    }: {
      id: string;
      nurseUserId: string;
      action: 'accept' | 'decline' | 'complete';
    }) => {
      if (action === 'accept') return nursingService.accept(id, nurseUserId);
      if (action === 'decline') return nursingService.decline(id, nurseUserId);
      return nursingService.complete(id, nurseUserId);
    },
    onSuccess: async (_data, variables) => {
      await invalidate();
      const key = variables.action === 'accept' ? 'accepted' : variables.action === 'decline' ? 'declined' : 'completed';
      Toast.show({ type: 'success', text1: t(`toast.${key}`) });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useVerifyNurseMutation() {
  const invalidate = useInvalidateNursing();
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: ({ userId, verification }: { userId: string; verification: NurseVerification }) =>
      nursingService.setNurseVerification(userId, verification),
    onSuccess: async () => {
      await invalidate();
      Toast.show({ type: 'success', text1: t('toast.verified') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}
