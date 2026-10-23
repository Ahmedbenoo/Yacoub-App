import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mockInvoicesService } from '@/shared/api/mock/invoices.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { DayCloseSummary, Invoice, InvoicePaymentMethod } from '@/shared/types/models/invoice';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const invoicesService = {
  getForAppointment: async (appointmentId: string): Promise<Invoice | null> => {
    if (!usesRealSession()) return mockInvoicesService.getForAppointment(appointmentId);
    const response = await apiClient.get<ApiResponse<Invoice | null>>(
      endpoints.invoices.forAppointment(appointmentId),
    );
    return response.data.data;
  },

  issue: async (appointmentId: string): Promise<Invoice> => {
    if (!usesRealSession()) return mockInvoicesService.issue(appointmentId);
    const response = await apiClient.post<ApiResponse<Invoice>>(endpoints.invoices.forAppointment(appointmentId));
    return response.data.data;
  },

  pay: async (appointmentId: string, paymentMethod: InvoicePaymentMethod): Promise<Invoice> => {
    if (!usesRealSession()) return mockInvoicesService.pay(appointmentId, paymentMethod);
    const response = await apiClient.post<ApiResponse<Invoice>>(endpoints.invoices.pay(appointmentId), {
      paymentMethod,
    });
    return response.data.data;
  },

  listToday: async (clinicId: string): Promise<Invoice[]> => {
    if (!usesRealSession()) return mockInvoicesService.listToday(clinicId);
    const response = await apiClient.get<ApiResponse<Invoice[]>>(endpoints.invoices.today, {
      params: { clinicId },
    });
    return response.data.data;
  },

  dayClose: async (clinicId: string): Promise<DayCloseSummary> => {
    if (!usesRealSession()) return mockInvoicesService.dayClose(clinicId);
    const response = await apiClient.get<ApiResponse<DayCloseSummary>>(endpoints.invoices.dayClose, {
      params: { clinicId },
    });
    return response.data.data;
  },
};
