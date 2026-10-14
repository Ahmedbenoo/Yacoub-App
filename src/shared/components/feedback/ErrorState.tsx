import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title, message, onRetry, retryLabel }: ErrorStateProps) {
  const { t } = useTranslation('common');

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text variant="titleSm" className="mb-2 text-center text-status-error">
        {title ?? t('error.title')}
      </Text>
      <Text variant="bodySm" muted className="mb-6 text-center">
        {message}
      </Text>
      {onRetry && <Button title={retryLabel ?? t('retry')} variant="outline" onPress={onRetry} />}
    </View>
  );
}
