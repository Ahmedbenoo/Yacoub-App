import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useSwitchClinicMutation, useUserClinicsQuery } from '@/features/clinic/hooks';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore, useLocaleStore } from '@/shared/stores';

interface ClinicSwitcherProps {
  compact?: boolean;
  onSwitched?: () => void;
}

export function ClinicSwitcher({ compact = false, onSwitched }: ClinicSwitcherProps) {
  const { t } = useTranslation('clinic');
  const locale = useLocaleStore((s) => s.locale);
  const activeClinicId = useAuthStore((s) => s.activeClinicId);
  const { data: clinics, isLoading } = useUserClinicsQuery();
  const switchMutation = useSwitchClinicMutation();

  if (isLoading || !clinics?.length) return null;
  if (clinics.length === 1 && compact) {
    const clinic = clinics[0];
    return (
      <View className="gap-1">
        <Text variant="label" muted>
          {t('active')}
        </Text>
        <Text variant="bodySm">{getClinicName(clinic, locale)}</Text>
      </View>
    );
  }

  if (clinics.length === 1) return null;

  return (
    <View className="gap-2">
      {!compact && (
        <Text variant="label" muted>
          {t('switch')}
        </Text>
      )}
      <View className="gap-2">
        {clinics.map((clinic) => {
          const isActive = clinic.id === activeClinicId;

          return (
            <Card
              key={clinic.id}
              className={`p-0 ${isActive ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/20' : ''}`}
            >
              <Pressable
                onPress={() => {
                  if (isActive || switchMutation.isPending) return;
                  switchMutation.mutate(clinic.id, {
                    onSuccess: () => {
                      Toast.show({ type: 'success', text1: t('switchSuccess') });
                      onSwitched?.();
                    },
                  });
                }}
                disabled={isActive || switchMutation.isPending}
                className="p-4 active:opacity-80"
              >
                <Row className="items-center justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text variant="label" numberOfLines={1}>
                      {getClinicName(clinic, locale)}
                    </Text>
                    <Text variant="caption" muted numberOfLines={1}>
                      {clinic.address.city}, {clinic.address.country}
                    </Text>
                  </View>
                  {isActive && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-600">
                      <Text variant="caption" className="text-center text-white">
                        ✓
                      </Text>
                    </View>
                  )}
                </Row>
              </Pressable>
            </Card>
          );
        })}
      </View>
    </View>
  );
}
