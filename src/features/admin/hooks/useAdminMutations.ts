import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { adminService } from '@/features/admin/services/admin.service';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type {
  CreateDoctorPayload,
  CreateSecretaryPayload,
  CreatePatientPayload,
  UpdateDoctorPayload,
  UpdatePatientPayload,
} from '@/shared/types/models/admin';

export function useUpdateDoctorMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDoctorPayload }) =>
      adminService.updateDoctor(id, payload),
    onSuccess: (doctor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.doctors.detail(doctor.id), doctor);
      Toast.show({ type: 'success', text1: t('toast.doctorUpdated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.updateFailed'), text2: apiError.message });
    },
  });
}

export function useUpdatePatientMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePatientPayload }) =>
      adminService.updatePatient(id, payload),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.setQueryData(queryKeys.patients.detail(patient.id), patient);
      Toast.show({ type: 'success', text1: t('toast.patientUpdated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.updateFailed'), text2: apiError.message });
    },
  });
}

export function useCreateDoctorMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (payload: CreateDoctorPayload) => adminService.createDoctor(payload),
    onSuccess: (doctor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
      Toast.show({
        type: 'success',
        text1: doctor.linkedExisting ? t('toast.doctorLinked') : t('toast.doctorCreated'),
        text2: doctor.credentialsWhatsApp ? t('staffAccess.sentToast') : undefined,
      });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.createFailed'), text2: apiError.message });
    },
  });
}

export function useCreateSecretaryMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (payload: CreateSecretaryPayload) => adminService.createSecretary(payload),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
      Toast.show({
        type: 'success',
        text1: t('toast.secretaryCreated'),
        text2: account.credentialsWhatsApp ? t('staffAccess.sentToast') : undefined,
      });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.createFailed'), text2: apiError.message });
    },
  });
}

export function useCreatePatientMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => adminService.createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      Toast.show({ type: 'success', text1: t('toast.patientCreated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.createFailed'), text2: apiError.message });
    },
  });
}

export function useDeactivateDoctorMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (id: string) => adminService.deactivateDoctor(id),
    onSuccess: (doctor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.doctors.detail(doctor.id), doctor);
      Toast.show({ type: 'success', text1: t('toast.doctorDeactivated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.deactivateFailed'), text2: apiError.message });
    },
  });
}

export function useDeactivatePatientMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (id: string) => adminService.deactivatePatient(id),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.setQueryData(queryKeys.patients.detail(patient.id), patient);
      Toast.show({ type: 'success', text1: t('toast.patientDeactivated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.deactivateFailed'), text2: apiError.message });
    },
  });
}

export function useReactivateDoctorMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (id: string) => adminService.reactivateDoctor(id),
    onSuccess: (doctor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.setQueryData(queryKeys.doctors.detail(doctor.id), doctor);
      Toast.show({ type: 'success', text1: t('toast.doctorReactivated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.reactivateFailed'), text2: apiError.message });
    },
  });
}

export function useReactivatePatientMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('admin');

  return useMutation({
    mutationFn: (id: string) => adminService.reactivatePatient(id),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.setQueryData(queryKeys.patients.detail(patient.id), patient);
      Toast.show({ type: 'success', text1: t('toast.patientReactivated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.reactivateFailed'), text2: apiError.message });
    },
  });
}
