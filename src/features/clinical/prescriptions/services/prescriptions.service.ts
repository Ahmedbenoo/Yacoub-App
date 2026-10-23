import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockPrescriptionsService } from '@/shared/api/mock/doctor.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type {
  CreatePrescriptionPayload,
  Prescription,
  UpdatePrescriptionPayload,
} from '@/shared/types/models/prescription';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const prescriptionsService = {
  byVisit: async (visitId: string): Promise<Prescription[]> => {
    if (!usesRealSession()) return mockPrescriptionsService.byVisit(visitId);
    const response = await apiClient.get<ApiResponse<Prescription[]>>(endpoints.prescriptions.byVisit(visitId));
    return response.data.data;
  },

  create: async (payload: CreatePrescriptionPayload): Promise<Prescription> => {
    if (!usesRealSession()) return mockPrescriptionsService.create(payload);
    const response = await apiClient.post<ApiResponse<Prescription>>(endpoints.prescriptions.create, payload);
    return response.data.data;
  },

  update: async (id: string, payload: UpdatePrescriptionPayload): Promise<Prescription> => {
    if (!usesRealSession()) return mockPrescriptionsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<Prescription>>(endpoints.prescriptions.update(id), payload);
    return response.data.data;
  },

  issue: async (id: string): Promise<Prescription> => {
    if (!usesRealSession()) return mockPrescriptionsService.issue(id);
    const response = await apiClient.post<ApiResponse<Prescription>>(endpoints.prescriptions.issue(id));
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    if (!usesRealSession()) return mockPrescriptionsService.remove(id);
    await apiClient.delete(endpoints.prescriptions.remove(id));
  },
};
