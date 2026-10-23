import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ClinicRulesPanel } from '@/features/admin/components/ClinicRulesPanel';
import { WalletPanel } from '@/features/wallet/components/WalletPanel';
import { Screen } from '@/shared/components/layout/Screen';
import { SettingsPanel } from '@/shared/components/layout/SettingsPanel';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { useActiveClinicQuery } from '@/features/clinic/hooks/useClinicQueries';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore, useLocaleStore } from '@/shared/stores';

export default function AdminMoreScreen() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const activeClinicId = useAuthStore((s) => s.activeClinicId);
  const canAddClinic = userId ? clinicsService.ownerHasCenter(userId) : false;
  const clinicQuery = useActiveClinicQuery();
  const clinicName = clinicQuery.data ? getClinicName(clinicQuery.data, locale) : '';

  const removeClinic = useMutation({
    mutationFn: () => clinicsService.remove(activeClinicId ?? ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      Toast.show({ type: 'success', text1: t('clinic.deleted') });
      router.replace('/search');
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('clinic.deleteFailed') });
    },
  });

  const askDelete = () => {
    if (!activeClinicId) return;
    Alert.alert(t('clinic.deleteTitle'), t('clinic.deleteMessage', { name: clinicName }), [
      { text: tc('cancel'), style: 'cancel' },
      { text: t('clinic.delete'), style: 'destructive', onPress: () => removeClinic.mutate() },
    ]);
  };

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
        {activeClinicId ? (
          <Button
            title={t('clinic.delete')}
            variant="danger"
            fullWidth
            loading={removeClinic.isPending}
            onPress={askDelete}
          />
        ) : null}
      </View>
      <WalletPanel mode="admin" />
      <SettingsPanel />
    </Screen>
  );
}
