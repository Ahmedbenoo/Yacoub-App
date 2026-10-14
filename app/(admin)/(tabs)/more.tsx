import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ClinicRulesPanel } from '@/features/admin/components/ClinicRulesPanel';
import { WalletPanel } from '@/features/wallet/components/WalletPanel';
import { Screen } from '@/shared/components/layout/Screen';
import { SettingsPanel } from '@/shared/components/layout/SettingsPanel';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { useAuthStore } from '@/shared/stores';

export default function AdminMoreScreen() {
  const { t } = useTranslation('admin');
  const userId = useAuthStore((s) => s.user?.id);
  const canAddClinic = userId ? clinicsService.ownerHasCenter(userId) : false;

  return (
    <Screen scroll>
      <Text variant="titleLg" className="py-4">
        {t('tabs.more')}
      </Text>
      <ClinicRulesPanel />
      <View className="gap-3 pb-2">
        {canAddClinic ? (
          <Button
            title={t('clinic.add')}
            variant="outline"
            fullWidth
            onPress={() => router.push('/(admin)/clinic/create')}
          />
        ) : null}
        <Button
          title={t('clinic.addSecretary')}
          variant="outline"
          fullWidth
          onPress={() => router.push('/(admin)/secretary/create')}
        />
      </View>
      <WalletPanel mode="admin" />
      <SettingsPanel />
    </Screen>
  );
}
