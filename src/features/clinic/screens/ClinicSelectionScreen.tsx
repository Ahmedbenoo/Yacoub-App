import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClinicSwitcher } from '@/features/clinic/components/ClinicSwitcher';
import { getHomeRouteForRole } from '@/shared/navigation/routes';
import { useRequireAuth } from '@/shared/navigation/guards';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import { useUserClinicsQuery } from '@/features/clinic/hooks';

export function ClinicSelectionScreen() {
  useRequireAuth();
  const { t } = useTranslation('clinic');
  const activeRole = useAuthStore((s) => s.activeRole);
  const { isLoading } = useUserClinicsQuery();

  return (
    <Screen scroll className="px-5">
      <Header showBack />

      <View className="gap-6 py-4">
        <View className="gap-2">
          <Text variant="titleLg">{t('title')}</Text>
          <Text variant="body" muted>
            {t('subtitle')}
          </Text>
        </View>

        {isLoading ? <Spinner /> : (
          <ClinicSwitcher
            onSwitched={() => {
              if (activeRole) {
                router.replace(getHomeRouteForRole(activeRole) as never);
              }
            }}
          />
        )}
      </View>
    </Screen>
  );
}
