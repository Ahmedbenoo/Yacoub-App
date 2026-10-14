import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { env } from '@/config/env';
import { Row } from '@/shared/components/layout/Row';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { resetMockDataCache } from '@/shared/lib/reset-mock-cache';
import { themeBg } from '@/shared/lib/utils';

export function ApiModeSetting() {
  const { t } = useTranslation('clinic');
  const isDark = useResolvedColorScheme() === 'dark';
  const [isResetting, setIsResetting] = useState(false);

  const handleResetMockCache = async () => {
    if (!env.useMockApi || isResetting) return;

    setIsResetting(true);
    try {
      await resetMockDataCache();
      Toast.show({ type: 'success', text1: t('mockCacheResetSuccess') });
    } catch {
      Toast.show({ type: 'error', text1: t('mockCacheResetFailed') });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View className="gap-3">
      <Row className="items-center justify-between">
        <Text variant="bodySm">{t('apiMode')}</Text>
        <Text variant="label" className="text-primary-600 dark:text-primary-400">
          {env.useMockApi ? t('mockApi') : t('realApi')}
        </Text>
      </Row>

      {env.useMockApi ? (
        <>
          <Text variant="caption" muted>
            {t('mockCacheHint')}
          </Text>
          <Pressable
            onPress={handleResetMockCache}
            disabled={isResetting}
            className={`items-center justify-center rounded-xl py-3 active:opacity-80 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
          >
            <Text variant="label" className="text-center">
              {isResetting ? t('mockCacheResetting') : t('mockCacheReset')}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
