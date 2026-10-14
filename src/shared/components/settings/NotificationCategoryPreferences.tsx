import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row } from '@/shared/components/layout/Row';
import { Switch } from '@/shared/components/ui/Switch';
import { Text } from '@/shared/components/ui/Text';
import { useNotificationPreferencesStore } from '@/shared/stores/notification-preferences-store';
import { NotificationType } from '@/shared/types/enums';

const CATEGORY_ORDER: NotificationType[] = [
  NotificationType.APPOINTMENT,
  NotificationType.PRESCRIPTION,
  NotificationType.LAB_RESULT,
  NotificationType.SYSTEM,
];

export function NotificationCategoryPreferences() {
  const { t } = useTranslation('common');
  const categories = useNotificationPreferencesStore((s) => s.categories);
  const setCategoryEnabled = useNotificationPreferencesStore((s) => s.setCategoryEnabled);

  return (
    <View className="gap-3">
      {CATEGORY_ORDER.map((type) => (
        <Row key={type} className="items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="body">{t(`settings.notificationCategories.${type}.title`)}</Text>
            <Text variant="caption" muted>
              {t(`settings.notificationCategories.${type}.description`)}
            </Text>
          </View>
          <Switch
            value={categories[type]}
            onValueChange={(enabled) => setCategoryEnabled(type, enabled)}
            testID={`notification-pref-${type}`}
            accessibilityRole="switch"
            accessibilityLabel={t(`settings.notificationCategories.${type}.title`)}
            accessibilityHint={t(`settings.notificationCategories.${type}.description`)}
            trackColor={{ false: '#CBD5E1', true: '#5EEAD4' }}
            thumbColor={categories[type] ? '#0D9488' : '#F8FAFC'}
          />
        </Row>
      ))}
    </View>
  );
}
