import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockNotificationsService } from '@/shared/api/mock/notifications.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/models';
import type { Notification } from '@/shared/types/models/notification';

export const notificationsService = {
  list: async (userId: string): Promise<PaginatedResponse<Notification>> => {
    if (env.useMockApi) {
      return mockNotificationsService.list(userId);
    }
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>(
      endpoints.notifications.list,
    );
    return response.data.data;
  },

  markRead: async (id: string, userId: string): Promise<Notification> => {
    if (env.useMockApi) {
      return mockNotificationsService.markRead(id, userId);
    }
    const response = await apiClient.post<ApiResponse<Notification>>(
      endpoints.notifications.markRead(id),
    );
    return response.data.data;
  },

  markAllRead: async (userId: string): Promise<void> => {
    if (env.useMockApi) {
      return mockNotificationsService.markAllRead(userId);
    }
    await apiClient.post(endpoints.notifications.markAllRead);
  },
};
