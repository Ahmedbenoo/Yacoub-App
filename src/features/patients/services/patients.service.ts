import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockPatientsService } from '@/shared/api/mock/patients.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/models';
import type {
  MedicalHistoryEntry,
  PatientFilters,
  PatientProfile,
} from '@/shared/types/models/patient';

export const patientsService = {
  list: async (filters: PatientFilters = {}): Promise<PaginatedResponse<PatientProfile>> => {
    if (env.useMockApi) return mockPatientsService.list(filters);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<PatientProfile>>>(
      endpoints.patients.list,
      { params: filters },
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<PatientProfile> => {
    if (env.useMockApi) return mockPatientsService.getById(id);
    const response = await apiClient.get<ApiResponse<PatientProfile>>(
      endpoints.patients.detail(id),
    );
    return response.data.data;
  },

  getHistory: async (id: string): Promise<MedicalHistoryEntry[]> => {
    if (env.useMockApi) return mockPatientsService.getHistory(id);
    const response = await apiClient.get<ApiResponse<MedicalHistoryEntry[]>>(
      endpoints.patients.history(id),
    );
    return response.data.data;
  },
};
