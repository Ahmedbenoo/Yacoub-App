import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { invoicesService } from '@/features/billing/services/invoices.service';
import { appointmentsService } from '@/features/appointments/services/appointments.service';
import { queryKeys } from '@/shared/api/query-keys';
import type { InvoicePaymentMethod } from '@/shared/types/models/invoice';

function useRefreshMoney() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  };
}

export function useAppointmentInvoiceQuery(appointmentId: string) {
  return useQuery({
    queryKey: queryKeys.invoices.forAppointment(appointmentId),
    queryFn: () => invoicesService.getForAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useIssueInvoiceMutation() {
  const refresh = useRefreshMoney();
  const { t } = useTranslation('appointments');
  return useMutation({
    mutationFn: (appointmentId: string) => invoicesService.issue(appointmentId),
    onSuccess: refresh,
    onError: () => Toast.show({ type: 'error', text1: t('billing.failed') }),
  });
}

export function usePayInvoiceMutation() {
  const refresh = useRefreshMoney();
  const { t } = useTranslation('appointments');
  return useMutation({
    mutationFn: (input: { appointmentId: string; paymentMethod: InvoicePaymentMethod }) =>
      invoicesService.pay(input.appointmentId, input.paymentMethod),
    onSuccess: () => {
      refresh();
      Toast.show({ type: 'success', text1: t('billing.paid') });
    },
    onError: () => Toast.show({ type: 'error', text1: t('billing.failed') }),
  });
}

export function useTodayInvoicesQuery(clinicId?: string) {
  return useQuery({
    queryKey: queryKeys.invoices.today(clinicId ?? ''),
    queryFn: () => invoicesService.listToday(clinicId!),
    enabled: Boolean(clinicId),
  });
}

export function useDayCloseQuery(clinicId?: string) {
  return useQuery({
    queryKey: queryKeys.invoices.dayClose(clinicId ?? ''),
    queryFn: () => invoicesService.dayClose(clinicId!),
    enabled: Boolean(clinicId),
  });
}

export function useCheckInMutation() {
  const refresh = useRefreshMoney();
  const { t } = useTranslation('appointments');
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentsService.checkIn(appointmentId),
    onSuccess: (appointment) => {
      refresh();
      Toast.show({ type: 'success', text1: t('queue.checkedIn') });
      return appointment;
    },
    onError: () => Toast.show({ type: 'error', text1: t('queue.failed') }),
  });
}

export function useQueueQuery(clinicId?: string) {
  return useQuery({
    queryKey: queryKeys.queue.today(clinicId ?? ''),
    queryFn: () => appointmentsService.queue(clinicId!),
    enabled: Boolean(clinicId),
  });
}

export function useCallNextMutation() {
  const refresh = useRefreshMoney();
  const { t } = useTranslation('appointments');
  return useMutation({
    mutationFn: (clinicId: string) => appointmentsService.callNext(clinicId),
    onSuccess: refresh,
    onError: () => Toast.show({ type: 'error', text1: t('queue.failed') }),
  });
}
