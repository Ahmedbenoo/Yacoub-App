import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockPrescriptionsService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type {
  CreatePrescriptionPayload,
  Prescription,
  UpdatePrescriptionPayload,
} from '@/shared/types/models/prescription';

export const prescriptionsService = {
  byVisit: async (visitId: string): Promise<Prescription[]> => {
    if (env.useMockApi) return mockPrescriptionsService.byVisit(visitId);
    const response = await apiClient.get<ApiResponse<Prescription[]>>(
      endpoints.prescriptions.byVisit(visitId),
    );
    return response.data.data;
  },

  create: async (payload: CreatePrescriptionPayload): Promise<Prescription> => {
    if (env.useMockApi) return mockPrescriptionsService.create(payload);
    const response = await apiClient.post<ApiResponse<Prescription>>(
      endpoints.prescriptions.create,
      payload,
    );
    return response.data.data;
  },

  update: async (id: string, payload: UpdatePrescriptionPayload): Promise<Prescription> => {
    if (env.useMockApi) return mockPrescriptionsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<Prescription>>(
      endpoints.prescriptions.update(id),
      payload,
    );
    return response.data.data;
  },

  issue: async (id: string): Promise<Prescription> => {
    if (env.useMockApi) return mockPrescriptionsService.issue(id);
    const response = await apiClient.post<ApiResponse<Prescription>>(
      endpoints.prescriptions.issue(id),
    );
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    if (env.useMockApi) return mockPrescriptionsService.remove(id);
    await apiClient.delete(endpoints.prescriptions.remove(id));
  },
};
