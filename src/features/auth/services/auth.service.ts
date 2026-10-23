import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockAuthService } from '@/shared/api/mock/auth.mock';
import { refreshAuthSession } from '@/shared/api/refresh-token';
import { endpoints } from '@/shared/api/endpoints';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse, AuthSession, User } from '@/shared/types/models';
import type { RegisterDoctorPayload, RegisterOwnerPayload } from '@/shared/types/models/admin';
import type { RegisterNursePayload } from '@/shared/types/models/nursing';

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

export const authService = {
  login: async (data: LoginFormData): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.login, data);
    return response.data.data;
  },

  registerDoctor: async (data: RegisterDoctorPayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.registerDoctor, data);
    return response.data.data;
  },

  registerOwner: async (data: RegisterOwnerPayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.registerOwner, data);
    return response.data.data;
  },

  registerNurse: async (data: RegisterNursePayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.nursing.registerNurse, data);
    return response.data.data;
  },

  register: async (data: RegisterFormData): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.register, data);
    return response.data.data;
  },

  loginOrRegisterByPhone: async (data: BookingAuthFormData & { password: string }): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.phone, data);
    return response.data.data;
  },

  requestLoginOtp: async (data: { phone: string; intent: 'login' | 'signup' }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(endpoints.auth.loginOtp, data);
    return response.data.data;
  },

  verifyLoginOtp: async (data: {
    phone: string;
    otp: string;
    firstName?: string;
    lastName?: string;
    clinicId?: string;
  }): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.verifyLoginOtp, data);
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const token = getAuthToken();
    if (!token) {
      throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
    }
    if (env.useMockApi && token.startsWith('mock-')) {
      return mockAuthService.getMe(token);
    }
    const response = await apiClient.get<ApiResponse<User>>(endpoints.auth.me);
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthSession> => {
    return refreshAuthSession(refreshToken);
  },

  forgotPassword: async (data: ForgotPasswordFormData): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.forgotPassword,
      data,
    );
    return response.data.data;
  },

  resendOtp: async (phone: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(endpoints.auth.resendOtp, { phone });
    return response.data.data;
  },

  verifyOtp: async (data: VerifyOtpFormData): Promise<{ resetToken: string }> => {
    const response = await apiClient.post<ApiResponse<{ resetToken: string }>>(
      endpoints.auth.verifyOtp,
      data,
    );
    return response.data.data;
  },

  resetPassword: async (data: ResetPasswordFormData): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.resetPassword,
      data,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) return;
    if (env.useMockApi && token.startsWith('mock-')) {
      await mockAuthService.logout(token);
      return;
    }
    await apiClient.post(endpoints.auth.logout);
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete(endpoints.auth.deleteAccount);
  },

  updateProfile: async (data: UpdateProfileFormData): Promise<User> => {
    const token = getAuthToken();
    if (!token) {
      throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
    }
    if (env.useMockApi && token.startsWith('mock-')) {
      return mockAuthService.updateProfile(token, data);
    }
    const response = await apiClient.patch<ApiResponse<User>>(endpoints.auth.updateProfile, data);
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordFormData): Promise<{ message: string }> => {
    const token = getAuthToken();
    if (!token) {
      throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
    }
    if (env.useMockApi && token.startsWith('mock-')) {
      return mockAuthService.changePassword(token, data);
    }
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.changePassword,
      data,
    );
    return response.data.data;
  },
};
