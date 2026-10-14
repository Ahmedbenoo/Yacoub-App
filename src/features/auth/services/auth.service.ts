import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockAuthService } from '@/shared/api/mock/auth.mock';
import { ownerRegistrationMock } from '@/shared/api/mock/owner-registration.mock';
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
  ResendOtpFormData,
  ResetPasswordFormData,
  UpdateProfileFormData,
  ChangePasswordFormData,
  VerifyOtpFormData,
} from '@/features/auth/schemas/auth.schemas';

export const authService = {
  login: async (data: LoginFormData): Promise<AuthSession> => {
    if (env.useMockApi) {
      return mockAuthService.login(data);
    }
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.login, data);
    return response.data.data;
  },

  registerDoctor: async (data: RegisterDoctorPayload): Promise<AuthSession> => {
    if (env.useMockApi) return ownerRegistrationMock.registerDoctor(data);
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.register, data);
    return response.data.data;
  },

  registerOwner: async (data: RegisterOwnerPayload): Promise<AuthSession> => {
    if (env.useMockApi) return ownerRegistrationMock.register(data);
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.register, data);
    return response.data.data;
  },

  registerNurse: async (data: RegisterNursePayload): Promise<AuthSession> => {
    if (env.useMockApi) return mockAuthService.registerNurse(data);
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.nursing.registerNurse, data);
    return response.data.data;
  },

  register: async (data: RegisterFormData): Promise<AuthSession> => {
    if (env.useMockApi) {
      return mockAuthService.register(data);
    }
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.register, data);
    return response.data.data;
  },

  loginOrRegisterByPhone: async (data: BookingAuthFormData): Promise<AuthSession> => {
    if (env.useMockApi) {
      return mockAuthService.loginOrRegisterByPhone(data);
    }
    const response = await apiClient.post<ApiResponse<AuthSession>>(endpoints.auth.register, data);
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    if (env.useMockApi) {
      const token = getAuthToken();
      if (!token) {
        throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
      }
      return mockAuthService.getMe(token);
    }
    const response = await apiClient.get<ApiResponse<User>>(endpoints.auth.me);
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthSession> => {
    return refreshAuthSession(refreshToken);
  },

  forgotPassword: async (data: ForgotPasswordFormData): Promise<{ message: string }> => {
    if (env.useMockApi) {
      return mockAuthService.forgotPassword(data);
    }
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.forgotPassword,
      data,
    );
    return response.data.data;
  },

  resendOtp: async (data: ResendOtpFormData): Promise<{ message: string }> => {
    if (env.useMockApi) {
      return mockAuthService.resendOtp(data);
    }
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.resendOtp,
      data,
    );
    return response.data.data;
  },

  verifyOtp: async (data: VerifyOtpFormData): Promise<{ resetToken: string }> => {
    if (env.useMockApi) {
      return mockAuthService.verifyOtp(data);
    }
    const response = await apiClient.post<ApiResponse<{ resetToken: string }>>(
      endpoints.auth.verifyOtp,
      data,
    );
    return response.data.data;
  },

  resetPassword: async (data: ResetPasswordFormData): Promise<{ message: string }> => {
    if (env.useMockApi) {
      return mockAuthService.resetPassword(data);
    }
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.resetPassword,
      data,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    if (env.useMockApi) {
      const token = getAuthToken();
      if (token) {
        await mockAuthService.logout(token);
      }
      return;
    }
    await apiClient.post(endpoints.auth.logout);
  },

  updateProfile: async (data: UpdateProfileFormData): Promise<User> => {
    if (env.useMockApi) {
      const token = getAuthToken();
      if (!token) {
        throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
      }
      return mockAuthService.updateProfile(token, data);
    }
    const response = await apiClient.patch<ApiResponse<User>>(endpoints.auth.updateProfile, data);
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordFormData): Promise<{ message: string }> => {
    if (env.useMockApi) {
      const token = getAuthToken();
      if (!token) {
        throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
      }
      return mockAuthService.changePassword(token, data);
    }
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.changePassword,
      data,
    );
    return response.data.data;
  },
};
