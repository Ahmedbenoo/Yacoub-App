import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockVisitsService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type { StartVisitPayload, UpdateVisitPayload, Visit } from '@/shared/types/models/visit';

export const visitsService = {
  getById: async (id: string): Promise<Visit> => {
    if (env.useMockApi) return mockVisitsService.getById(id);
    const response = await apiClient.get<ApiResponse<Visit>>(endpoints.visits.detail(id));
    return response.data.data;
  },

  getByPatient: async (patientId: string): Promise<Visit[]> => {
    if (env.useMockApi) return mockVisitsService.getByPatient(patientId);
    const response = await apiClient.get<ApiResponse<Visit[]>>(endpoints.visits.list, {
      params: { patientId },
    });
    return response.data.data;
  },

  getActiveByPatient: async (patientId: string): Promise<Visit | null> => {
    if (env.useMockApi) return mockVisitsService.getActiveByPatient(patientId);
    const response = await apiClient.get<ApiResponse<Visit | null>>(endpoints.visits.list, {
      params: { patientId, status: 'in_progress' },
    });
    return response.data.data;
  },

  start: async (payload: StartVisitPayload): Promise<Visit> => {
    if (env.useMockApi) return mockVisitsService.start(payload);
    const response = await apiClient.post<ApiResponse<Visit>>(endpoints.visits.start, payload);
    return response.data.data;
  },

  update: async (id: string, payload: UpdateVisitPayload): Promise<Visit> => {
    if (env.useMockApi) return mockVisitsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<Visit>>(endpoints.visits.update(id), payload);
    return response.data.data;
  },

  complete: async (id: string): Promise<Visit> => {
    if (env.useMockApi) return mockVisitsService.complete(id);
    const response = await apiClient.post<ApiResponse<Visit>>(endpoints.visits.complete(id));
    return response.data.data;
  },
};
