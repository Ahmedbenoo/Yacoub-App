import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { authService } from '@/features/auth/services/auth.service';
import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { useAuthFlowStore } from '@/features/auth/store/auth-flow.store';
import type {
  BookingAuthFormData,
  ForgotPasswordFormData,
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  UpdateProfileFormData,
  ChangePasswordFormData,
  VerifyOtpFormData,
} from '@/features/auth/schemas/auth.schemas';
import { normalizeApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { User } from '@/shared/types/models';
import type { RegisterDoctorPayload, RegisterOwnerPayload } from '@/shared/types/models/admin';
import type { RegisterNursePayload } from '@/shared/types/models/nursing';

async function handlePostLogin(user: User) {
  await resolvePostAuthNavigation(user);
}

function invalidateAuthQueries() {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
}

export function useLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      handlePostLogin(session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.loginFailed'), text2: apiError.message });
    },
  });
}

export function useRegisterNurseMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const { t } = useTranslation('nursing');

  return useMutation({
    mutationFn: (data: RegisterNursePayload) => authService.registerNurse(data),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      handlePostLogin(session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.failed'), text2: apiError.message });
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: RegisterFormData) => authService.register(data),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      handlePostLogin(session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.registrationFailed'), text2: apiError.message });
    },
  });
}

export function useRegisterDoctorMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: RegisterDoctorPayload) => authService.registerDoctor(data),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      handlePostLogin(session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.registrationFailed'), text2: apiError.message });
    },
  });
}

export function useRegisterOwnerMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: RegisterOwnerPayload) => authService.registerOwner(data),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      handlePostLogin(session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.registrationFailed'), text2: apiError.message });
    },
  });
}

export function useForgotPasswordMutation() {
  const setResetEmail = useAuthFlowStore((s) => s.setResetEmail);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: ForgotPasswordFormData) => authService.forgotPassword(data),
    onSuccess: (_result, variables) => {
      setResetEmail(variables.email);
      Toast.show({
        type: 'success',
        text1: t('toast.codeSent'),
        text2: t('toast.codeSentHint'),
      });
      router.push('/(auth)/verify-otp');
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.error'), text2: apiError.message });
    },
  });
}

export function useVerifyOtpMutation() {
  const setResetToken = useAuthFlowStore((s) => s.setResetToken);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: VerifyOtpFormData) => authService.verifyOtp(data),
    onSuccess: (result) => {
      setResetToken(result.resetToken);
      router.push('/(auth)/reset-password');
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.verificationFailed'), text2: apiError.message });
    },
  });
}

export function useResendOtpMutation() {
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (email: string) => authService.resendOtp({ email }),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('toast.codeResent'),
        text2: t('toast.codeResentHint'),
      });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.resendFailed'), text2: apiError.message });
    },
  });
}

export function useResetPasswordMutation() {
  const clearResetFlow = useAuthFlowStore((s) => s.clearResetFlow);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: ResetPasswordFormData) => authService.resetPassword(data),
    onSuccess: () => {
      clearResetFlow();
      Toast.show({
        type: 'success',
        text1: t('toast.success'),
        text2: t('toast.passwordResetSuccess'),
      });
      router.replace('/(auth)/login');
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.error'), text2: apiError.message });
    },
  });
}

export function useBookingAuthMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: BookingAuthFormData) => authService.loginOrRegisterByPhone(data),
    onSuccess: async (session) => {
      await setSession(session);
      await setActiveRole(UserRole.PATIENT);
      queryClient.setQueryData(queryKeys.auth.me, session.user);
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      if (apiError.code === 'NAME_REQUIRED') return;
      Toast.show({ type: 'error', text1: t('toast.loginFailed'), text2: apiError.message });
    },
  });
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearResetFlow = useAuthFlowStore((s) => s.clearResetFlow);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: async () => {
      await clearSession();
      clearResetFlow();
      queryClient.clear();
      router.replace('/(auth)/login');
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({
        type: 'info',
        text1: t('toast.signedOut'),
        text2: apiError.message || t('toast.sessionCleared'),
      });
    },
  });
}

export function useUpdateProfileMutation() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: UpdateProfileFormData) => authService.updateProfile(data),
    onSuccess: async (user) => {
      await updateUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
      invalidateAuthQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      Toast.show({ type: 'success', text1: t('toast.profileUpdated') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.updateFailed'), text2: apiError.message });
    },
  });
}

export function useChangePasswordMutation() {
  const { t } = useTranslation('auth');

  return useMutation({
    mutationFn: (data: ChangePasswordFormData) => authService.changePassword(data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: t('toast.passwordChanged') });
    },
    onError: (error) => {
      const apiError = normalizeApiError(error);
      Toast.show({ type: 'error', text1: t('toast.passwordChangeFailed'), text2: apiError.message });
    },
  });
}

export function useLogout() {
  const mutation = useLogoutMutation();
  return () => mutation.mutate();
}

export { invalidateAuthQueries };
