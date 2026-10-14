import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { prescriptionsService } from '@/features/clinical/prescriptions/services/prescriptions.service';
import type { PrescriptionFormData } from '@/features/doctor/schemas/doctor.schemas';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { UpdatePrescriptionPayload } from '@/shared/types/models/prescription';

export function usePrescriptionsQuery(visitId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.byVisit(visitId),
    queryFn: () => prescriptionsService.byVisit(visitId),
    enabled: Boolean(visitId),
  });
}

function invalidatePrescriptionReads(
  queryClient: ReturnType<typeof useQueryClient>,
  visitId?: string,
) {
  if (visitId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.byVisit(visitId) });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.clinical.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
}

function toMedicationPayload(data: PrescriptionFormData): UpdatePrescriptionPayload {
  return {
    medications: [
      {
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
      },
    ],
    instructions: data.instructions,
  };
}

export function useCreatePrescriptionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: PrescriptionFormData }) =>
      prescriptionsService.create({
        visitId,
        ...toMedicationPayload(data),
      }),
    onSuccess: (_, { visitId }) => {
      invalidatePrescriptionReads(queryClient, visitId);
      Toast.show({ type: 'success', text1: t('toast.prescriptionDraftSaved') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useUpdatePrescriptionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({
      id,
      visitId: _visitId,
      data,
    }: {
      id: string;
      visitId: string;
      data: PrescriptionFormData;
    }) => prescriptionsService.update(id, toMedicationPayload(data)),
    onSuccess: (_, { visitId }) => {
      invalidatePrescriptionReads(queryClient, visitId);
      Toast.show({ type: 'success', text1: t('toast.prescriptionUpdated') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useIssuePrescriptionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({ id }: { id: string; visitId: string }) => prescriptionsService.issue(id),
    onSuccess: (_, { visitId }) => {
      invalidatePrescriptionReads(queryClient, visitId);
      Toast.show({ type: 'success', text1: t('toast.prescriptionIssued') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useDeletePrescriptionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({ id }: { id: string; visitId: string }) => prescriptionsService.remove(id),
    onSuccess: (_, { visitId }) => {
      invalidatePrescriptionReads(queryClient, visitId);
      Toast.show({ type: 'success', text1: t('toast.prescriptionDeleted') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}
