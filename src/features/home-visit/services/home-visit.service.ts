import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockHomeVisitService } from '@/shared/api/mock/home-visits.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { AcceptHomeVisitPayload, CreateHomeVisitPayload, HomeVisitRequest } from '@/shared/types/models/home-visit';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const homeVisitService = {
  listForPatient: async (patientUserId: string): Promise<HomeVisitRequest[]> => {
    if (!usesRealSession()) return mockHomeVisitService.listForPatient(patientUserId);
    const response = await apiClient.get<ApiResponse<HomeVisitRequest[]>>(endpoints.homeVisits.requests, {
      params: { patientUserId },
    });
    return response.data.data;
  },

  listForDoctor: async (doctorId: string): Promise<HomeVisitRequest[]> => {
    if (!usesRealSession()) return mockHomeVisitService.listForDoctor(doctorId);
    const response = await apiClient.get<ApiResponse<HomeVisitRequest[]>>(endpoints.homeVisits.requests, {
      params: { doctorId },
    });
    return response.data.data;
  },

  getRequest: async (id: string): Promise<HomeVisitRequest> => {
    if (!usesRealSession()) return mockHomeVisitService.getRequest(id);
    const response = await apiClient.get<ApiResponse<HomeVisitRequest>>(endpoints.homeVisits.request(id));
    return response.data.data;
  },

  createRequest: async (payload: CreateHomeVisitPayload): Promise<HomeVisitRequest> => {
    if (!usesRealSession()) return mockHomeVisitService.createRequest(payload);
    const response = await apiClient.post<ApiResponse<HomeVisitRequest>>(endpoints.homeVisits.requests, payload);
    return response.data.data;
  },

  accept: async (id: string, payload: AcceptHomeVisitPayload): Promise<HomeVisitRequest> => {
    if (!usesRealSession()) return mockHomeVisitService.accept(id, payload);
    const response = await apiClient.post<ApiResponse<HomeVisitRequest>>(endpoints.homeVisits.accept(id), payload);
    return response.data.data;
  },

  complete: async (id: string, doctorId: string): Promise<HomeVisitRequest> => {
    if (!usesRealSession()) return mockHomeVisitService.complete(id, doctorId);
    const response = await apiClient.post<ApiResponse<HomeVisitRequest>>(endpoints.homeVisits.complete(id), {
      doctorId,
    });
    return response.data.data;
  },

  setting: async (): Promise<{ enabled: boolean }> => {
    if (!usesRealSession()) return { enabled: false };
    const response = await apiClient.get<ApiResponse<{ enabled: boolean }>>(endpoints.doctors.homeVisits);
    return response.data.data;
  },

  enable: async (): Promise<{ enabled: boolean }> => {
    if (!usesRealSession()) return { enabled: true };
    const response = await apiClient.post<ApiResponse<{ enabled: boolean }>>(endpoints.doctors.homeVisits);
    return response.data.data;
  },
};
