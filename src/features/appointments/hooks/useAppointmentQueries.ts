import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { appointmentsService } from '@/features/appointments/services/appointments.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import type { AppointmentFilters, CreateAppointmentPayload, RescheduleAppointmentPayload } from '@/shared/types/models/appointment';

export function useAppointmentsQuery(filters: AppointmentFilters = {}, enabled = true) {
  const activeClinicId = useAuthStore((s) => s.activeClinicId);
  const scopedFilters = {
    ...filters,
    clinicId: filters.clinicId ?? activeClinicId ?? undefined,
  };

  return useQuery({
    queryKey: queryKeys.appointments.list(scopedFilters as Record<string, unknown>),
    queryFn: () => appointmentsService.list(scopedFilters),
    enabled: enabled && Boolean(activeClinicId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAppointmentDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentsService.getById(id),
    enabled: enabled && Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.appointments.detail(appointment.id), appointment);
      Toast.show({ type: 'success', text1: t('cancelSuccess') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('cancelFailed'), text2: apiError.message });
    },
  });
}

export function useConfirmAppointmentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: (id: string) => appointmentsService.confirm(id),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.all });
      queryClient.setQueryData(queryKeys.appointments.detail(appointment.id), appointment);
      Toast.show({ type: 'success', text1: t('confirmSuccess') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('confirmFailed'), text2: apiError.message });
    },
  });
}

export function useNoShowAppointmentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: (id: string) => appointmentsService.markNoShow(id),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.appointments.detail(appointment.id), appointment);
      Toast.show({ type: 'success', text1: t('noShowSuccess') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('noShowFailed'), text2: apiError.message });
    },
  });
}

export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAppointmentPayload }) =>
      appointmentsService.reschedule(id, payload),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.appointments.detail(appointment.id), appointment);
      Toast.show({ type: 'success', text1: t('rescheduleSuccess') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('rescheduleFailed'), text2: apiError.message });
    },
  });
}

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentsService.create(payload),
    onSuccess: (_appointment, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      Toast.show({ type: 'success', text1: payload.desk ? t('bookSuccess') : t('bookPending') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('bookFailed'), text2: apiError.message });
    },
  });
}
