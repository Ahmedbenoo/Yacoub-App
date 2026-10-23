import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { notifySessionExpired } from '@/shared/lib/auth-events';
import { getActiveClinicId, getAuthToken, useAuthStore } from '@/shared/stores/auth-store';
import type { ApiError } from '@/shared/types/models';

import { endpoints } from './endpoints';
import { refreshAuthSession } from './refresh-token';

let refreshPromise: Promise<string | null> | null = null;

const AUTH_PATHS = [
  endpoints.auth.login,
  endpoints.auth.register,
  endpoints.auth.registerOwner,
  endpoints.auth.registerDoctor,
  endpoints.auth.phone,
  endpoints.auth.refresh,
  endpoints.auth.forgotPassword,
  endpoints.auth.verifyOtp,
  endpoints.auth.resendOtp,
  endpoints.auth.resetPassword,
];

function isAuthPath(url?: string): boolean {
  if (!url) return false;
  return AUTH_PATHS.some((path) => url.includes(path));
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  const clinicId = getActiveClinicId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (clinicId) {
    config.headers['X-Clinic-Id'] = clinicId;
  }

  const locale = useAuthStore.getState().user?.locale;
  if (locale) {
    config.headers['Accept-Language'] = locale;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthPath(requestUrl)
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      await useAuthStore.getState().clearSession();
      notifySessionExpired();
    }

    const apiError: ApiError = {
      code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, clearSession } = useAuthStore.getState();

  if (!refreshToken) {
    await clearSession();
    notifySessionExpired();
    return null;
  }

  try {
    const session = await refreshAuthSession(refreshToken);
    await useAuthStore.getState().setSession(session);
    return session.accessToken;
  } catch {
    await clearSession();
    notifySessionExpired();
    return null;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
}
