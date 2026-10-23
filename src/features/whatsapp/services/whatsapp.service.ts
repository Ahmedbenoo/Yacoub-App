import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockWhatsAppService } from '@/shared/api/mock/whatsapp.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { WhatsAppMessage } from '@/shared/types/models/whatsapp';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const whatsAppService = {
  listForAppointment: async (appointmentId: string): Promise<WhatsAppMessage[]> => {
    if (!usesRealSession()) return mockWhatsAppService.listForAppointment(appointmentId);
    const response = await apiClient.get<ApiResponse<WhatsAppMessage[]>>(endpoints.whatsapp.forAppointment(appointmentId));
    return response.data.data;
  },
};
