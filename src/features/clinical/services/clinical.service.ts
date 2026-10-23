import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockPatientClinicalService } from '@/shared/api/mock/patient-clinical.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { LabRequest } from '@/shared/types/models/lab-request';
import type { Prescription } from '@/shared/types/models/prescription';
import type { PatientVisitDetail } from '@/shared/types/models/visit';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const clinicalService = {
  getPrescription: async (id: string): Promise<Prescription> => {
    if (!usesRealSession()) return mockPatientClinicalService.getPrescriptionById(id);
    const response = await apiClient.get<ApiResponse<Prescription>>(endpoints.clinical.prescriptionDetail(id));
    return response.data.data;
  },

  recordLabResult: async (id: string, resultSummary: string): Promise<LabRequest> => {
    if (!usesRealSession()) return mockPatientClinicalService.recordLabResult(id, resultSummary);
    const response = await apiClient.patch<ApiResponse<LabRequest>>(endpoints.clinical.labResultDetail(id), {
      resultSummary,
    });
    return response.data.data;
  },

  getLabResult: async (id: string): Promise<LabRequest> => {
    if (!usesRealSession()) return mockPatientClinicalService.getLabResultById(id);
    const response = await apiClient.get<ApiResponse<LabRequest>>(endpoints.clinical.labResultDetail(id));
    return response.data.data;
  },

  getVisit: async (id: string): Promise<PatientVisitDetail> => {
    if (!usesRealSession()) return mockPatientClinicalService.getVisitById(id);
    const response = await apiClient.get<ApiResponse<PatientVisitDetail>>(endpoints.clinical.visitDetail(id));
    return response.data.data;
  },
};
