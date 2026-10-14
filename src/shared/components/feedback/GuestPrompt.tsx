import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/shared/components/feedback/EmptyState';

interface GuestPromptProps {
  title: string;
  description: string;
}

export function GuestPrompt({ title, description }: GuestPromptProps) {
  const { t } = useTranslation('auth');

  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={t('login.signIn')}
      onAction={() => router.push('/(auth)/login')}
    />
  );
}
