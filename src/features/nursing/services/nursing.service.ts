import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockNursingService } from '@/shared/api/mock/nursing.mock';
import { endpoints } from '@/shared/api/endpoints';
import { NurseVerification } from '@/shared/types/enums';
import type { ApiResponse } from '@/shared/types/models';
import type {
  CreateHomeNursingRequestPayload,
  HomeNursingRequest,
  NurseProfile,
} from '@/shared/types/models/nursing';

export const nursingService = {
  listForPatient: async (patientUserId: string): Promise<HomeNursingRequest[]> => {
    if (env.useMockApi) return mockNursingService.listForPatient(patientUserId);
    const response = await apiClient.get<ApiResponse<HomeNursingRequest[]>>(endpoints.nursing.requests, {
      params: { patientUserId },
    });
    return response.data.data;
  },

  listForAdmin: async (): Promise<HomeNursingRequest[]> => {
    if (env.useMockApi) return mockNursingService.listRequests();
    const response = await apiClient.get<ApiResponse<HomeNursingRequest[]>>(endpoints.nursing.requests);
    return response.data.data;
  },

  listForNurse: async (nurseUserId: string): Promise<HomeNursingRequest[]> => {
    if (env.useMockApi) return mockNursingService.listForNurse(nurseUserId);
    const response = await apiClient.get<ApiResponse<HomeNursingRequest[]>>(endpoints.nursing.requests, {
      params: { nurseUserId },
    });
    return response.data.data;
  },

  getRequest: async (id: string): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.getRequest(id);
    const response = await apiClient.get<ApiResponse<HomeNursingRequest>>(endpoints.nursing.request(id));
    return response.data.data;
  },

  createRequest: async (payload: CreateHomeNursingRequestPayload): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.createRequest(payload);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.requests, payload);
    return response.data.data;
  },

  priceAndNotify: async (id: string, price: number): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.priceAndNotify(id, price);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.price(id), {
      price,
    });
    return response.data.data;
  },

  assignNurse: async (id: string, nurseUserId: string): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.assignNurse(id, nurseUserId);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.assign(id), {
      nurseUserId,
    });
    return response.data.data;
  },

  accept: async (id: string, nurseUserId: string): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.accept(id, nurseUserId);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.accept(id));
    return response.data.data;
  },

  decline: async (id: string, nurseUserId: string): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.decline(id, nurseUserId);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.decline(id));
    return response.data.data;
  },

  complete: async (id: string, nurseUserId: string): Promise<HomeNursingRequest> => {
    if (env.useMockApi) return mockNursingService.complete(id, nurseUserId);
    const response = await apiClient.post<ApiResponse<HomeNursingRequest>>(endpoints.nursing.complete(id));
    return response.data.data;
  },

  listNurses: async (): Promise<NurseProfile[]> => {
    if (env.useMockApi) return mockNursingService.listNurses();
    const response = await apiClient.get<ApiResponse<NurseProfile[]>>(endpoints.nursing.nurses);
    return response.data.data;
  },

  getNurse: async (userId: string): Promise<NurseProfile | null> => {
    if (env.useMockApi) return mockNursingService.getNurse(userId);
    const response = await apiClient.get<ApiResponse<NurseProfile>>(endpoints.nursing.verifyNurse(userId));
    return response.data.data;
  },

  setNurseVerification: async (userId: string, verification: NurseVerification): Promise<NurseProfile> => {
    if (env.useMockApi) return mockNursingService.setNurseVerification(userId, verification);
    const response = await apiClient.post<ApiResponse<NurseProfile>>(endpoints.nursing.verifyNurse(userId), {
      verification,
    });
    return response.data.data;
  },
};
