import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { PushNotificationSetting } from '@/shared/components/settings/PushNotificationSetting';
import { NotificationCategoryPreferences } from '@/shared/components/settings/NotificationCategoryPreferences';

export function AdminNotificationSettingsScreen() {
  const { t } = useTranslation('common');

  return (
    <Screen scroll>
      <Header showBack title={t('settings.pushNotifications')} />
      <View className="gap-4 pb-8">
        <Card>
          <Text variant="label" className="mb-3">
            {t('settings.pushNotifications')}
          </Text>
          <PushNotificationSetting />
        </Card>
        <Card>
          <Text variant="label" className="mb-3">
            {t('settings.notificationCategories.title')}
          </Text>
          <NotificationCategoryPreferences />
        </Card>
      </View>
    </Screen>
  );
}
