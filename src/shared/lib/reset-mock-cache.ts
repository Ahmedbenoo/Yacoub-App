import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockAuthService } from '@/shared/api/mock/auth.mock';
import { queryKeys } from '@/shared/api/query-keys';
import { queryClient } from '@/shared/lib/query-client';
import { getAuthToken, useAuthStore } from '@/shared/stores';

const QUERY_CACHE_KEY = 'clinify-query-cache';

export async function resetMockDataCache(): Promise<void> {
  queryClient.clear();
  await AsyncStorage.removeItem(QUERY_CACHE_KEY);

  const { isAuthenticated, updateUser } = useAuthStore.getState();
  if (isAuthenticated) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
      }
      const user = await mockAuthService.getMe(token);
      await updateUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    } catch {
      // Session may be invalid; lists will still refresh from cleared cache.
    }
  }

  await queryClient.invalidateQueries();
}
