import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { ThemeSettingsCard } from '@/shared/components/layout/SettingsPanel';

export function AdminThemeScreen() {
  const { t } = useTranslation('common');

  return (
    <Screen scroll>
      <Header showBack title={t('settings.theme')} />
      <View className="pb-8">
        <ThemeSettingsCard />
      </View>
    </Screen>
  );
}
