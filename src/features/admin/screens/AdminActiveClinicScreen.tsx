import { View } from 'react-native';

import { ClinicSwitcher } from '@/features/clinic/components/ClinicSwitcher';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';

export function AdminActiveClinicScreen() {
  return (
    <Screen scroll>
      <Header showBack title="الفروع" />
      <View className="pb-8">
        <Card>
          <ClinicSwitcher compact />
        </Card>
      </View>
    </Screen>
  );
}
