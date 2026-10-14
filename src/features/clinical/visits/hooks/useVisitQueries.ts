import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { visitsService } from '@/features/clinical/visits/services/visits.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { UpdateVisitPayload } from '@/shared/types/models/visit';

export function useVisitQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.visits.detail(id),
    queryFn: () => visitsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateVisitMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVisitPayload }) =>
      visitsService.update(id, payload),
    onSuccess: (visit) => {
      queryClient.setQueryData(queryKeys.visits.detail(visit.id), visit);
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useCompleteVisitMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: (id: string) => visitsService.complete(id),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.setQueryData(queryKeys.visits.detail(visit.id), visit);
      Toast.show({ type: 'success', text1: t('toast.visitCompleted') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}
