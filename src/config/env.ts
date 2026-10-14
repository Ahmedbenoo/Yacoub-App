import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.string().url(),
  useMockApi: z.boolean(),
  sentryDsn: z.string().optional(),
  enableMonitoring: z.boolean(),
});

function parseEnv() {
  const raw = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
    useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
    enableMonitoring: process.env.EXPO_PUBLIC_ENABLE_MONITORING === 'true',
  };

  return envSchema.parse(raw);
}

export const env = parseEnv();
