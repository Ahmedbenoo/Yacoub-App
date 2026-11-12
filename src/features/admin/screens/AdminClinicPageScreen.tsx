import { View } from 'react-native';

import { ClinicListingEditor } from '@/features/admin/components/ClinicListingEditor';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { AccountSettingsCard } from '@/shared/components/layout/SettingsPanel';

export function AdminClinicPageScreen() {
  return (
    <Screen scroll>
      <Header showBack title="صفحة العيادة" />
      <View className="gap-4 pb-8">
        <AccountSettingsCard showAvatar={false} />
        <ClinicListingEditor />
      </View>
    </Screen>
  );
}
