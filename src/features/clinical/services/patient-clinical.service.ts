import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockPatientClinicalService } from '@/shared/api/mock/patient-clinical.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type { LabRequest } from '@/shared/types/models/lab-request';
import type { Prescription } from '@/shared/types/models/prescription';
import type { PatientVisitDetail } from '@/shared/types/models/visit';

export const patientClinicalService = {
  listPrescriptions: async (userId: string): Promise<Prescription[]> => {
    if (env.useMockApi) return mockPatientClinicalService.listPrescriptions(userId);
    const response = await apiClient.get<ApiResponse<Prescription[]>>(endpoints.patients.myPrescriptions);
    return response.data.data;
  },

  getPrescription: async (userId: string, id: string): Promise<Prescription> => {
    if (env.useMockApi) return mockPatientClinicalService.getPrescription(userId, id);
    const response = await apiClient.get<ApiResponse<Prescription>>(endpoints.patients.prescriptionDetail(id));
    return response.data.data;
  },

  listLabResults: async (userId: string): Promise<LabRequest[]> => {
    if (env.useMockApi) return mockPatientClinicalService.listLabResults(userId);
    const response = await apiClient.get<ApiResponse<LabRequest[]>>(endpoints.patients.myLabResults);
    return response.data.data;
  },

  getLabResult: async (userId: string, id: string): Promise<LabRequest> => {
    if (env.useMockApi) return mockPatientClinicalService.getLabResult(userId, id);
    const response = await apiClient.get<ApiResponse<LabRequest>>(endpoints.patients.labResultDetail(id));
    return response.data.data;
  },

  getVisit: async (userId: string, id: string): Promise<PatientVisitDetail> => {
    if (env.useMockApi) return mockPatientClinicalService.getVisit(userId, id);
    const response = await apiClient.get<ApiResponse<PatientVisitDetail>>(
      endpoints.patients.visitDetail(id),
    );
    return response.data.data;
  },
};
