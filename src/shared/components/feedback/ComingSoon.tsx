import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Text } from '@/shared/components/ui/Text';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useTranslation('common');

  return (
    <EmptyState
      title={title ?? t('comingSoon')}
      description={description ?? t('comingSoonDescription')}
      icon={
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Text variant="titleLg" className="text-primary-600 dark:text-primary-400">
            +
          </Text>
        </View>
      }
    />
  );
}
