import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { clinicsService } from '@/features/clinic/services/clinics.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import type { AddOwnerClinicPayload } from '@/shared/types/models/admin';

export function useUserClinicsQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.activeRole);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...queryKeys.clinics.list(userId ?? ''), role, 'branches'],
    queryFn: () => clinicsService.listForUser(userId!, role),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 1000 * 60 * 10,
  });
}

export function useActiveClinicQuery() {
  const activeClinicId = useAuthStore((s) => s.activeClinicId);

  return useQuery({
    queryKey: queryKeys.clinics.detail(activeClinicId ?? ''),
    queryFn: () => clinicsService.getById(activeClinicId!),
    enabled: Boolean(activeClinicId),
    staleTime: 1000 * 60 * 30,
  });
}

export function useAddOwnerClinicMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (payload: AddOwnerClinicPayload) => clinicsService.addClinic(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
      Toast.show({ type: 'success', text1: t('toast.clinicCreated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.createFailed'), text2: apiError.message });
    },
  });
}

export function useSwitchClinicMutation() {
  const queryClient = useQueryClient();
  const setActiveClinic = useAuthStore((s) => s.setActiveClinic);

  return useMutation({
    mutationFn: (clinicId: string) => setActiveClinic(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
