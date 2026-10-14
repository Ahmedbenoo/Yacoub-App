import { QueryClient } from '@tanstack/react-query';

import { captureException } from '@/shared/lib/monitoring';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      networkMode: 'offlineFirst',
      retry: 2,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        captureException(error, { scope: 'mutation' });
      },
    },
  },
});
