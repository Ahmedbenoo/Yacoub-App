import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  formatNursingPriceRange,
  nursingServicesByKind,
  quoteNursingServices,
  type NursingService,
} from '@/shared/catalog/nursing-services';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';

export function PatientNursingRequestScreen() {
  const { t } = useTranslation('nursing');
  const { rowStyle } = useLayoutDirection();
  const user = useAuthStore((s) => s.user);
  const [selectedIds, setSelectedIds] = useState<NursingService['id'][]>([]);
  const [serviceKind, setServiceKind] = useState<'visit' | 'shift'>('visit');
  const quote = quoteNursingServices(selectedIds);

  const toggle = (serviceId: NursingService['id']) => {
    setSelectedIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  };

  const goComplete = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!selectedIds.length) return;
    router.push({
      pathname: '/(patient)/nursing/complete',
      params: { services: selectedIds.join(',') },
    } as never);
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('requestTitle')} />
      <View className="gap-5 py-4">
        <Text variant="bodySm" muted>
          {t('requestHint')}
        </Text>
        <Text variant="bodySm">{t('chooseService')}</Text>
        <SegmentedControl
          value={serviceKind}
          onChange={setServiceKind}
          options={[
            { value: 'visit', label: t('visitsTitle') },
            { value: 'shift', label: t('shiftsTitle') },
          ]}
        />
        <Text variant="caption" muted>
          {serviceKind === 'visit' ? t('visitsHint') : t('shiftsHint')}
        </Text>
        <ServiceGroup
          services={nursingServicesByKind(serviceKind)}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
        {quote ? (
          <View style={[rowStyle, { alignItems: 'center', justifyContent: 'space-between' }]} className="rounded-2xl bg-primary-600 px-4 py-3">
            <Text variant="label" className="text-white">
              {t('selectionTotal', { count: selectedIds.length })}
            </Text>
            <Text variant="label" className="text-white">
              {formatNursingPriceRange(quote.priceMin, quote.priceMax)} {t('currency')}
            </Text>
          </View>
        ) : null}
        <Button
          title={t('continueRequest')}
          onPress={goComplete}
          disabled={!selectedIds.length}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}

function ServiceGroup({
  services,
  selectedIds,
  onToggle,
}: {
  services: NursingService[];
  selectedIds: string[];
  onToggle: (serviceId: NursingService['id']) => void;
}) {
  const { t } = useTranslation('nursing');
  const { rowStyle } = useLayoutDirection();

  return (
    <View style={[rowStyle, { flexWrap: 'wrap', gap: 8 }]}>
      {services.map((service) => {
        const selected = selectedIds.includes(service.id);
        return (
          <Pressable
            key={service.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(service.id)}
            style={{ flexGrow: 1, flexBasis: '47%', minWidth: '47%', maxWidth: '48%' }}
          >
            <View
              className={`h-full items-center justify-center rounded-2xl border px-3 py-3 ${
                selected
                  ? 'border-primary-600 bg-teal-50 dark:bg-teal-950/40'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              <Text variant="label" className="text-center" numberOfLines={2}>
                {t(`services.${service.id}.name`)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
