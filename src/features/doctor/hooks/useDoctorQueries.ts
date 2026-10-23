import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { labRequestsService } from '@/features/clinical/lab-orders/services/lab-requests.service';
import { visitsService } from '@/features/clinical/visits/services/visits.service';
import { availabilityService } from '@/features/doctor/services/doctor.service';
import type { LabRequestFormData, VisitNotesFormData } from '@/features/doctor/schemas/doctor.schemas';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { UpdateAvailabilityPayload } from '@/shared/types/models/availability';
import type { CreateLabRequestPayload } from '@/shared/types/models/lab-request';
import type { StartVisitPayload, UpdateVisitPayload } from '@/shared/types/models/visit';
import { LabRequestType } from '@/shared/types/enums';

export { useVisitQuery, useUpdateVisitMutation, useCompleteVisitMutation } from '@/features/clinical/visits/hooks/useVisitQueries';
export {
  usePrescriptionsQuery,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useIssuePrescriptionMutation,
  useDeletePrescriptionMutation,
} from '@/features/clinical/prescriptions/hooks/usePrescriptionsQueries';
export { useLabRequestsQuery } from '@/features/clinical/lab-orders/hooks/useLabRequestsQueries';

export function useAvailabilityQuery() {
  return useQuery({
    queryKey: queryKeys.doctors.availability('current'),
    queryFn: () => availabilityService.get(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStartVisitMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: (payload: StartVisitPayload) => visitsService.start(payload),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.setQueryData(queryKeys.visits.detail(visit.id), visit);
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useCreateLabRequestMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: LabRequestFormData }) => {
      const payload: CreateLabRequestPayload = {
        visitId,
        type: data.type === 'imaging' ? LabRequestType.IMAGING : LabRequestType.LAB,
        testName: data.testName,
        priority: data.priority,
        notes: data.notes,
      };
      return labRequestsService.create(payload);
    },
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labRequests.byVisit(visitId) });
      Toast.show({ type: 'success', text1: t('toast.requestSubmitted') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctor');

  return useMutation({
    mutationFn: ({
      doctorId,
      ...payload
    }: UpdateAvailabilityPayload & { doctorId: string }) =>
      availabilityService.updateFor(doctorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      Toast.show({ type: 'success', text1: t('toast.availabilityUpdated') });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: t('toast.error'), text2: normalizeApiError(error).message });
    },
  });
}

export function mapVisitFormToPayload(data: VisitNotesFormData): UpdateVisitPayload {
  return {
    chiefComplaint: data.chiefComplaint,
    symptoms: data.symptoms,
    diagnosis: data.diagnosis,
    notes: data.notes,
    vitals: {
      bloodPressure: data.bloodPressure || undefined,
      heartRate: data.heartRate ? Number(data.heartRate) : undefined,
      temperature: data.temperature ? Number(data.temperature) : undefined,
      weight: data.weight ? Number(data.weight) : undefined,
    },
  };
}
