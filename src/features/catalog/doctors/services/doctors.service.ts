import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockDoctorsService } from '@/shared/api/mock/doctors.mock';
import { mockAvailabilityService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/models';
import type { DoctorAvailability } from '@/shared/types/models/availability';
import type { DoctorFilters, DoctorProfile } from '@/shared/types/models/doctor';

export const doctorsService = {
  list: async (filters: DoctorFilters = {}): Promise<PaginatedResponse<DoctorProfile>> => {
    if (env.useMockApi) return mockDoctorsService.list(filters);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<DoctorProfile>>>(
      endpoints.doctors.list,
      { params: filters },
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<DoctorProfile> => {
    if (env.useMockApi) return mockDoctorsService.getById(id);
    const response = await apiClient.get<ApiResponse<DoctorProfile>>(endpoints.doctors.detail(id));
    return response.data.data;
  },

  getAvailability: async (id: string): Promise<DoctorAvailability> => {
    if (env.useMockApi) return mockAvailabilityService.get(id);
    const response = await apiClient.get<ApiResponse<DoctorAvailability>>(
      endpoints.doctors.availability(id),
    );
    return response.data.data;
  },

  getSpecialties: (): string[] => {
    if (env.useMockApi) return mockDoctorsService.getSpecialties();
    return [];
  },
};
