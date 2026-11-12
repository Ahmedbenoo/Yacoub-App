import { View } from 'react-native';

import { WalletPanel } from '@/features/wallet/components/WalletPanel';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';

export function AdminWalletScreen() {
  return (
    <Screen scroll>
      <Header showBack title="المحفظة" />
      <View className="pb-8">
        <WalletPanel mode="admin" />
      </View>
    </Screen>
  );
}
