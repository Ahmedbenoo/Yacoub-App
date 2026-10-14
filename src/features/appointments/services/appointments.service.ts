import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockAppointmentsService } from '@/shared/api/mock/appointments.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/models';
import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
} from '@/shared/types/models/appointment';
import { useAuthStore } from '@/shared/stores';

export const appointmentsService = {
  list: async (filters: AppointmentFilters = {}): Promise<PaginatedResponse<Appointment>> => {
    if (env.useMockApi) {
      return mockAppointmentsService.list(filters);
    }
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Appointment>>>(
      endpoints.appointments.list,
      { params: filters },
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    if (env.useMockApi) {
      return mockAppointmentsService.getById(id);
    }
    const response = await apiClient.get<ApiResponse<Appointment>>(
      endpoints.appointments.detail(id),
    );
    return response.data.data;
  },

  cancel: async (id: string): Promise<Appointment> => {
    if (env.useMockApi) {
      return mockAppointmentsService.cancel(id, useAuthStore.getState().user?.id);
    }
    const response = await apiClient.post<ApiResponse<Appointment>>(
      endpoints.appointments.cancel(id),
    );
    return response.data.data;
  },

  confirm: async (id: string): Promise<Appointment> => {
    if (env.useMockApi) {
      return mockAppointmentsService.confirm(id, useAuthStore.getState().user?.id);
    }
    const response = await apiClient.post<ApiResponse<Appointment>>(
      endpoints.appointments.confirm(id),
    );
    return response.data.data;
  },

  markNoShow: async (id: string): Promise<Appointment> => {
    if (env.useMockApi) {
      return mockAppointmentsService.markNoShow(id, useAuthStore.getState().user?.id);
    }
    throw { code: 'NOT_SUPPORTED', message: 'No-show is not available on the live API yet' };
  },

  reschedule: async (id: string, payload: RescheduleAppointmentPayload): Promise<Appointment> => {
    if (env.useMockApi) {
      return mockAppointmentsService.reschedule(
        id,
        payload.scheduledAt,
        payload.by,
        useAuthStore.getState().user?.id,
      );
    }
    const response = await apiClient.patch<ApiResponse<Appointment>>(
      endpoints.appointments.reschedule(id),
      payload,
    );
    return response.data.data;
  },

  create: async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const user = useAuthStore.getState().user;
    if (!user) throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };

    if (env.useMockApi) {
      return mockAppointmentsService.create(
        payload,
        payload.patientId ?? user.id,
        { firstName: user.firstName, lastName: user.lastName },
      );
    }
    const response = await apiClient.post<ApiResponse<Appointment>>(
      endpoints.appointments.create,
      payload,
    );
    return response.data.data;
  },

  checkIn: async (id: string): Promise<Appointment> => {
    if (env.useMockApi) return mockAppointmentsService.checkIn(id);
    const response = await apiClient.post<ApiResponse<Appointment>>(endpoints.appointments.checkIn(id));
    return response.data.data;
  },

  queue: async (clinicId: string): Promise<Appointment[]> => {
    if (env.useMockApi) return mockAppointmentsService.queue(clinicId);
    const response = await apiClient.get<ApiResponse<Appointment[]>>(endpoints.appointments.queue, {
      params: { clinicId },
    });
    return response.data.data;
  },

  callNext: async (clinicId: string): Promise<Appointment[]> => {
    if (env.useMockApi) return mockAppointmentsService.callNext(clinicId);
    const response = await apiClient.post<ApiResponse<Appointment[]>>(endpoints.appointments.callNext, {
      clinicId,
    });
    return response.data.data;
  },
};
