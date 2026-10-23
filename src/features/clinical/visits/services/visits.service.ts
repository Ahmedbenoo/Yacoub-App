import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockVisitsService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { StartVisitPayload, UpdateVisitPayload, Visit } from '@/shared/types/models/visit';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const visitsService = {
  getById: async (id: string): Promise<Visit> => {
    if (!usesRealSession()) return mockVisitsService.getById(id);
    const response = await apiClient.get<ApiResponse<Visit>>(endpoints.visits.detail(id));
    return response.data.data;
  },

  getByPatient: async (patientId: string): Promise<Visit[]> => {
    if (!usesRealSession()) return mockVisitsService.getByPatient(patientId);
    const response = await apiClient.get<ApiResponse<Visit[]>>(endpoints.visits.list, {
      params: { patientId },
    });
    return response.data.data;
  },

  getActiveByPatient: async (patientId: string): Promise<Visit | null> => {
    if (!usesRealSession()) return mockVisitsService.getActiveByPatient(patientId);
    const response = await apiClient.get<ApiResponse<Visit | null>>(endpoints.visits.list, {
      params: { patientId, status: 'in_progress' },
    });
    return response.data.data;
  },

  start: async (payload: StartVisitPayload): Promise<Visit> => {
    if (!usesRealSession()) return mockVisitsService.start(payload);
    const response = await apiClient.post<ApiResponse<Visit>>(endpoints.visits.start, payload);
    return response.data.data;
  },

  update: async (id: string, payload: UpdateVisitPayload): Promise<Visit> => {
    if (!usesRealSession()) return mockVisitsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<Visit>>(endpoints.visits.update(id), payload);
    return response.data.data;
  },

  complete: async (id: string): Promise<Visit> => {
    if (!usesRealSession()) return mockVisitsService.complete(id);
    const response = await apiClient.post<ApiResponse<Visit>>(endpoints.visits.complete(id));
    return response.data.data;
  },
};
