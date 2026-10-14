import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockReviewsService } from '@/shared/api/mock/reviews.mock';
import type { ApiResponse } from '@/shared/types/models';
import type { CreateDoctorReviewPayload, DoctorReview } from '@/shared/types/models/review';

export const reviewsService = {
  listForDoctor: async (doctorId: string): Promise<DoctorReview[]> => {
    if (env.useMockApi) return mockReviewsService.listForDoctor(doctorId);
    const response = await apiClient.get<ApiResponse<DoctorReview[]>>(endpoints.reviews.forDoctor(doctorId));
    return response.data.data;
  },

  getForAppointment: async (appointmentId: string): Promise<DoctorReview | null> => {
    if (env.useMockApi) return mockReviewsService.getForAppointment(appointmentId);
    const response = await apiClient.get<ApiResponse<DoctorReview | null>>(
      endpoints.reviews.forAppointment(appointmentId),
    );
    return response.data.data;
  },

  create: async (payload: CreateDoctorReviewPayload): Promise<DoctorReview> => {
    if (env.useMockApi) return mockReviewsService.create(payload);
    const response = await apiClient.post<ApiResponse<DoctorReview>>(endpoints.reviews.create, payload);
    return response.data.data;
  },
};
