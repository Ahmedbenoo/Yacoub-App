import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockPatientClinicalService } from '@/shared/api/mock/patient-clinical.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type { LabRequest } from '@/shared/types/models/lab-request';
import type { Prescription } from '@/shared/types/models/prescription';
import type { PatientVisitDetail } from '@/shared/types/models/visit';

export const clinicalService = {
  getPrescription: async (id: string): Promise<Prescription> => {
    if (env.useMockApi) return mockPatientClinicalService.getPrescriptionById(id);
    const response = await apiClient.get<ApiResponse<Prescription>>(
      endpoints.clinical.prescriptionDetail(id),
    );
    return response.data.data;
  },

  recordLabResult: async (id: string, resultSummary: string): Promise<LabRequest> => {
    if (env.useMockApi) return mockPatientClinicalService.recordLabResult(id, resultSummary);
    const response = await apiClient.patch<ApiResponse<LabRequest>>(
      endpoints.clinical.labResultDetail(id),
      { resultSummary },
    );
    return response.data.data;
  },

  getLabResult: async (id: string): Promise<LabRequest> => {
    if (env.useMockApi) return mockPatientClinicalService.getLabResultById(id);
    const response = await apiClient.get<ApiResponse<LabRequest>>(
      endpoints.clinical.labResultDetail(id),
    );
    return response.data.data;
  },

  getVisit: async (id: string): Promise<PatientVisitDetail> => {
    if (env.useMockApi) return mockPatientClinicalService.getVisitById(id);
    const response = await apiClient.get<ApiResponse<PatientVisitDetail>>(
      endpoints.clinical.visitDetail(id),
    );
    return response.data.data;
  },
};
