import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockPatientsService } from '@/shared/api/mock/patients.mock';
import { endpoints } from '@/shared/api/endpoints';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/models';
import type {
  MedicalHistoryEntry,
  PatientFilters,
  PatientProfile,
  UpdateHealthProfilePayload,
} from '@/shared/types/models/patient';

export const patientsService = {
  list: async (filters: PatientFilters = {}): Promise<PaginatedResponse<PatientProfile>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<PatientProfile>>>(
      endpoints.patients.list,
      { params: filters },
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<PatientProfile> => {
    const response = await apiClient.get<ApiResponse<PatientProfile>>(
      endpoints.patients.detail(id),
    );
    return response.data.data;
  },

  updateHealthProfile: async (id: string, payload: UpdateHealthProfilePayload): Promise<PatientProfile> => {
    const token = getAuthToken();
    const real = !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
    if (!real) return mockPatientsService.updateHealthProfile(id, payload);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.patients.healthProfile(id),
      payload,
    );
    return response.data.data;
  },

  replyDocument: async (patientId: string, documentId: string, message: string): Promise<MedicalHistoryEntry> => {
    const token = getAuthToken();
    const real = !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
    if (!real) return mockPatientsService.replyDocument(patientId, documentId, message);
    const response = await apiClient.post<ApiResponse<MedicalHistoryEntry>>(
      endpoints.patients.replyDocument(patientId, documentId),
      { message },
    );
    return response.data.data;
  },

  getHistory: async (id: string): Promise<MedicalHistoryEntry[]> => {
    const token = getAuthToken();
    const real = !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
    if (!real) return mockPatientsService.getHistory(id);
    const response = await apiClient.get<ApiResponse<MedicalHistoryEntry[]>>(
      endpoints.patients.history(id),
    );
    return response.data.data;
  },
};
