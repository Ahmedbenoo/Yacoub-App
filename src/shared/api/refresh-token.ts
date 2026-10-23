import axios from 'axios';

import { env } from '@/config/env';
import type { ApiResponse, AuthSession } from '@/shared/types/models';

import { endpoints } from './endpoints';
import { mockAuthService } from './mock/auth.mock';

export async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
  if (env.useMockApi && refreshToken.startsWith('mock-')) {
    return mockAuthService.refresh(refreshToken);
  }

  const response = await axios.post<ApiResponse<AuthSession>>(
    `${env.apiUrl}${endpoints.auth.refresh}`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );

  return response.data.data;
}
