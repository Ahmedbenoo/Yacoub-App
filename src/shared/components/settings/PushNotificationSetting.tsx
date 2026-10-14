import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row } from '@/shared/components/layout/Row';
import {
  getPushPermissionStatus,
  requestPushPermissions,
  type PushPermissionStatus,
} from '@/shared/lib/push-notifications';
import { Text } from '@/shared/components/ui/Text';

export function PushNotificationSetting() {
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<PushPermissionStatus>('undetermined');

  useEffect(() => {
    getPushPermissionStatus().then(setStatus);
  }, []);

  const statusLabel = {
    granted: t('settings.pushEnabled'),
    denied: t('settings.pushDisabled'),
    undetermined: t('settings.pushDisabled'),
    unsupported: t('settings.pushUnsupported'),
  }[status];

  const handlePress = async () => {
    if (status === 'unsupported') return;
    const nextStatus = await requestPushPermissions();
    setStatus(nextStatus);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={status === 'unsupported' || status === 'granted'}
      className="active:opacity-70"
    >
      <Row className="items-center justify-between">
        <Text variant="bodySm" muted>
          {status === 'undetermined' ? t('settings.enablePushHint') : t('settings.pushStatus')}
        </Text>
        <Text variant="label" className="text-primary-600 dark:text-primary-400">
          {status === 'undetermined' ? t('settings.enablePush') : statusLabel}
        </Text>
      </Row>
    </Pressable>
  );
}
