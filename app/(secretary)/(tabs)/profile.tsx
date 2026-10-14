import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/layout/Screen';
import { SettingsPanel } from '@/shared/components/layout/SettingsPanel';
import { Text } from '@/shared/components/ui/Text';

export default function SecretaryProfileScreen() {
  const { t } = useTranslation('secretary');

  return (
    <Screen scroll>
      <Text variant="titleMd" className="py-3">
        {t('tabs.profile')}
      </Text>
      <SettingsPanel />
    </Screen>
  );
}
