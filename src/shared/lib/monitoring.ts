import { env } from '@/config/env';

type MonitoringContext = Record<string, unknown>;

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  initialized = true;

  if (!env.enableMonitoring) return;

  if (env.sentryDsn) {
    console.info('[monitoring] Sentry DSN configured — wire @sentry/react-native in production builds');
  }
}

export function captureException(error: unknown, context?: MonitoringContext): void {
  if (__DEV__) {
    console.error('[monitoring]', error, context);
    return;
  }

  if (!env.enableMonitoring) return;

  // Production: forward to Sentry or other provider when configured
  console.error('[monitoring]', error, context);
}

export function captureMessage(message: string, context?: MonitoringContext): void {
  if (__DEV__) {
    console.info('[monitoring]', message, context);
    return;
  }

  if (!env.enableMonitoring) return;

  console.info('[monitoring]', message, context);
}
