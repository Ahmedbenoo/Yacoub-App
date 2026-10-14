import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { reviewsService } from '@/features/reviews/services/reviews.service';
import { queryKeys } from '@/shared/api/query-keys';
import type { CreateDoctorReviewPayload } from '@/shared/types/models/review';

export function useDoctorReviewsQuery(doctorId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.forDoctor(doctorId),
    queryFn: () => reviewsService.listForDoctor(doctorId),
    enabled: Boolean(doctorId),
  });
}

export function useAppointmentReviewQuery(appointmentId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.forAppointment(appointmentId),
    queryFn: () => reviewsService.getForAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('appointments');

  return useMutation({
    mutationFn: (payload: CreateDoctorReviewPayload) => reviewsService.create(payload),
    onSuccess: (review) => {
      queryClient.setQueryData(queryKeys.reviews.forAppointment(review.appointmentId), review);
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.forDoctor(review.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      Toast.show({ type: 'success', text1: t('review.saved') });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('review.failed') });
    },
  });
}
