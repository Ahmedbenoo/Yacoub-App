import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { WalletPanel } from '@/features/wallet/components/WalletPanel';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';

export function WalletScreen() {
  const { t } = useTranslation('common');

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('settings.walletTitle')} />
      <View className="py-4">
        <WalletPanel mode="self" />
      </View>
    </Screen>
  );
}
