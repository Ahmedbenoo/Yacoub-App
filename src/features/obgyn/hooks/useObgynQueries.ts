import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { obgynService } from '@/features/obgyn/services/obgyn.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { AddClinicalAttachmentInput } from '@/shared/types/models/clinical-attachment';
import type { AddVaccinationDoseInput } from '@/shared/types/models/newborn';
import type { ClosePregnancyInput, CreatePregnancyInput, SaveObgynEncounterInput } from '@/shared/types/models/obgyn';
import type { SaveUltrasoundInput } from '@/shared/types/models/ultrasound-report';

function useObgynError() {
  const { t } = useTranslation('doctor');
  return (error: unknown) => {
    const normalized = normalizeApiError(error);
    Toast.show({ type: 'error', text1: t('toast.error'), text2: normalized.message });
  };
}

export function usePregnanciesQuery(patientId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.obgyn.pregnancies(patientId),
    queryFn: () => obgynService.listPregnancies(patientId),
    enabled: Boolean(patientId) && enabled,
  });
}

export function useObgynEncounterQuery(visitId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.obgyn.encounter(visitId),
    queryFn: () => obgynService.getEncounter(visitId),
    enabled: Boolean(visitId) && enabled,
  });
}

export function useObgynSummaryQuery(visitId: string) {
  return useQuery({
    queryKey: queryKeys.obgyn.summary(visitId),
    queryFn: () => obgynService.visitSummary(visitId),
    enabled: Boolean(visitId),
  });
}

export function usePriorMeasurementsQuery(pregnancyId: string | undefined, beforeIso: string) {
  return useQuery({
    queryKey: queryKeys.obgyn.prior(pregnancyId ?? '', beforeIso),
    queryFn: () => obgynService.priorMeasurements(pregnancyId ?? '', beforeIso),
    enabled: Boolean(pregnancyId),
  });
}

export function useVisitAttachmentsQuery(visitId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.obgyn.attachments(visitId),
    queryFn: () => obgynService.listAttachments(visitId),
    enabled: Boolean(visitId) && enabled,
  });
}

export function useUltrasoundQuery(labRequestId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.obgyn.ultrasound(labRequestId ?? ''),
    queryFn: () => obgynService.getUltrasound(labRequestId ?? ''),
    enabled: Boolean(labRequestId),
  });
}

export function useChildChartQuery(childPatientId: string) {
  return useQuery({
    queryKey: queryKeys.obgyn.child(childPatientId),
    queryFn: () => obgynService.childChart(childPatientId),
    enabled: Boolean(childPatientId),
  });
}

export function useMyChildrenQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.obgyn.myChildren(),
    queryFn: () => obgynService.listMyChildren(),
    enabled,
  });
}

export function useCreatePregnancyMutation(patientId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: (input: CreatePregnancyInput) => obgynService.createPregnancy(patientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.pregnancies(patientId) });
    },
    onError,
  });
}

export function useClosePregnancyMutation(patientId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClosePregnancyInput }) =>
      obgynService.closePregnancy(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.pregnancies(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
    onError,
  });
}

export function useSaveEncounterMutation(visitId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: (input: SaveObgynEncounterInput) => obgynService.saveEncounter(visitId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.all });
    },
    onError,
  });
}

export function useSaveUltrasoundMutation(labRequestId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: (input: SaveUltrasoundInput) => obgynService.saveUltrasound(labRequestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.ultrasound(labRequestId) });
    },
    onError,
  });
}

export function useAddAttachmentMutation(visitId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: (input: AddClinicalAttachmentInput) => obgynService.addAttachment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.attachments(visitId) });
    },
    onError,
  });
}

export function useAddDoseMutation(childPatientId: string) {
  const queryClient = useQueryClient();
  const onError = useObgynError();
  return useMutation({
    mutationFn: (input: AddVaccinationDoseInput) => obgynService.addDose(childPatientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obgyn.child(childPatientId) });
    },
    onError,
  });
}
