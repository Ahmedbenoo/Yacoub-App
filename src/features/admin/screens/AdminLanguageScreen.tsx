import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { LanguageSettingsCard } from '@/shared/components/layout/SettingsPanel';

export function AdminLanguageScreen() {
  const { t } = useTranslation('common');

  return (
    <Screen scroll>
      <Header showBack title={t('settings.language')} />
      <View className="pb-8">
        <LanguageSettingsCard />
      </View>
    </Screen>
  );
}
