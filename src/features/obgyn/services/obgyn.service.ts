import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockObgynService } from '@/shared/api/mock/obgyn.mock';
import {
  addVaccinationDose,
  listNewbornsForMother,
  readChildChart,
} from '@/shared/api/mock/newborn.mock';
import { getPatientIdsForUser } from '@/shared/api/mock/patients.mock';
import { getAuthToken, useAuthStore } from '@/shared/stores/auth-store';
import { UserRole } from '@/shared/types/enums';
import type { ApiResponse } from '@/shared/types/models';
import type { AddClinicalAttachmentInput, ClinicalAttachment } from '@/shared/types/models/clinical-attachment';
import type { AddVaccinationDoseInput, ChildChart, NewbornLink } from '@/shared/types/models/newborn';
import type {
  ClosePregnancyInput,
  CreatePregnancyInput,
  ObgynEncounter,
  ObgynVisitSummary,
  PregnancyRecord,
  PriorObgynMeasurement,
  SaveObgynEncounterInput,
} from '@/shared/types/models/obgyn';
import type { SaveUltrasoundInput, UltrasoundReport } from '@/shared/types/models/ultrasound-report';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const obgynService = {
  listPregnancies: async (patientId: string): Promise<PregnancyRecord[]> => {
    if (!usesRealSession()) return mockObgynService.listPregnancies(patientId);
    const response = await apiClient.get<ApiResponse<PregnancyRecord[]>>(endpoints.obgyn.pregnancies, {
      params: { patientId },
    });
    return response.data.data;
  },
  createPregnancy: async (patientId: string, input: CreatePregnancyInput): Promise<PregnancyRecord> => {
    if (!usesRealSession()) return mockObgynService.createPregnancy(patientId, input);
    const response = await apiClient.post<ApiResponse<PregnancyRecord>>(endpoints.obgyn.pregnancies, {
      patientId,
      ...input,
    });
    return response.data.data;
  },
  closePregnancy: async (id: string, input: ClosePregnancyInput): Promise<PregnancyRecord> => {
    if (!usesRealSession()) return mockObgynService.closePregnancy(id, input);
    const response = await apiClient.post<ApiResponse<PregnancyRecord>>(endpoints.obgyn.closePregnancy(id), input);
    return response.data.data;
  },
  childLink: async (pregnancyId: string): Promise<NewbornLink | null> => {
    if (!usesRealSession()) return mockObgynService.childLink(pregnancyId);
    const response = await apiClient.get<ApiResponse<NewbornLink | null>>(endpoints.obgyn.childLink(pregnancyId));
    return response.data.data;
  },
  getEncounter: async (visitId: string): Promise<ObgynEncounter | null> => {
    if (!usesRealSession()) return mockObgynService.getEncounter(visitId);
    const response = await apiClient.get<ApiResponse<ObgynEncounter | null>>(endpoints.obgyn.encounter(visitId));
    return response.data.data;
  },
  saveEncounter: async (visitId: string, input: SaveObgynEncounterInput): Promise<ObgynEncounter> => {
    if (!usesRealSession()) return mockObgynService.saveEncounter(visitId, input);
    const response = await apiClient.put<ApiResponse<ObgynEncounter>>(endpoints.obgyn.encounter(visitId), input);
    return response.data.data;
  },
  priorMeasurements: async (pregnancyId: string, beforeIso: string): Promise<PriorObgynMeasurement[]> => {
    if (!usesRealSession()) return mockObgynService.priorMeasurements(pregnancyId, beforeIso);
    const response = await apiClient.get<ApiResponse<PriorObgynMeasurement[]>>(endpoints.obgyn.prior(pregnancyId), {
      params: { pregnancyId, before: beforeIso },
    });
    return response.data.data;
  },
  visitSummary: async (visitId: string): Promise<ObgynVisitSummary | null> => {
    if (!usesRealSession()) return mockObgynService.visitSummary(visitId);
    const response = await apiClient.get<ApiResponse<ObgynVisitSummary | null>>(endpoints.obgyn.summary(visitId));
    return response.data.data;
  },
  saveUltrasound: async (labRequestId: string, input: SaveUltrasoundInput): Promise<UltrasoundReport> => {
    if (!usesRealSession()) return mockObgynService.saveUltrasound(labRequestId, input);
    const response = await apiClient.put<ApiResponse<UltrasoundReport>>(endpoints.obgyn.ultrasound(labRequestId), input);
    return response.data.data;
  },
  getUltrasound: async (labRequestId: string): Promise<UltrasoundReport | null> => {
    if (!usesRealSession()) return mockObgynService.getUltrasound(labRequestId);
    const response = await apiClient.get<ApiResponse<UltrasoundReport | null>>(endpoints.obgyn.ultrasound(labRequestId));
    return response.data.data;
  },
  addAttachment: async (input: AddClinicalAttachmentInput): Promise<ClinicalAttachment> => {
    if (!usesRealSession()) return mockObgynService.addAttachment(input);
    const response = await apiClient.post<ApiResponse<ClinicalAttachment>>(endpoints.clinical.attachments, input);
    return response.data.data;
  },
  listAttachments: async (visitId: string): Promise<ClinicalAttachment[]> => {
    if (!usesRealSession()) return mockObgynService.listAttachments(visitId);
    const response = await apiClient.get<ApiResponse<ClinicalAttachment[]>>(endpoints.clinical.attachments, {
      params: { visitId },
    });
    return response.data.data;
  },
  childChart: async (childPatientId: string): Promise<ChildChart> => {
    if (!usesRealSession()) return readChildChart(childPatientId);
    const response = await apiClient.get<ApiResponse<ChildChart>>(endpoints.obgyn.child(childPatientId));
    return response.data.data;
  },
  listMyChildren: async (): Promise<ChildChart[]> => {
    if (!usesRealSession()) {
      const userId = useAuthStore.getState().user?.id;
      if (!userId || useAuthStore.getState().activeRole !== UserRole.PATIENT) return [];
      return listNewbornsForMother(getPatientIdsForUser(userId));
    }
    const response = await apiClient.get<ApiResponse<ChildChart[]>>(endpoints.obgyn.myChildren);
    return response.data.data;
  },
  addDose: async (childPatientId: string, input: AddVaccinationDoseInput): Promise<ChildChart> => {
    if (!usesRealSession()) {
      if (useAuthStore.getState().activeRole !== UserRole.DOCTOR) {
        throw { code: 'FORBIDDEN', message: 'Only the treating doctor can update doses' };
      }
      await readChildChart(childPatientId);
      return addVaccinationDose(childPatientId, input);
    }
    const response = await apiClient.post<ApiResponse<ChildChart>>(endpoints.obgyn.doses(childPatientId), input);
    return response.data.data;
  },
};
