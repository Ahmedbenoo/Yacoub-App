import { useTranslation } from 'react-i18next';

import { AppErrorBoundary } from '@/shared/components/feedback/AppErrorBoundary';

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  const { t } = useTranslation('common');

  return (
    <AppErrorBoundary
      fallbackTitle={t('errorBoundary.title')}
      fallbackDescription={t('errorBoundary.description')}
      retryLabel={t('retry')}
    >
      {children}
    </AppErrorBoundary>
  );
}
