import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Text } from '@/shared/components/ui/Text';

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2">
      <Text variant="caption" className="text-center font-medium text-white">
        {t('offline.message')}
      </Text>
    </View>
  );
}
