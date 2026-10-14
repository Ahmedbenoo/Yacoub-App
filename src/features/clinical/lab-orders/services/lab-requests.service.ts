import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockLabRequestsService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type { CreateLabRequestPayload, LabRequest } from '@/shared/types/models/lab-request';

export const labRequestsService = {
  byVisit: async (visitId: string): Promise<LabRequest[]> => {
    if (env.useMockApi) return mockLabRequestsService.byVisit(visitId);
    const response = await apiClient.get<ApiResponse<LabRequest[]>>(
      endpoints.labRequests.byVisit(visitId),
    );
    return response.data.data;
  },

  create: async (payload: CreateLabRequestPayload): Promise<LabRequest> => {
    if (env.useMockApi) return mockLabRequestsService.create(payload);
    const response = await apiClient.post<ApiResponse<LabRequest>>(
      endpoints.labRequests.create,
      payload,
    );
    return response.data.data;
  },
};
