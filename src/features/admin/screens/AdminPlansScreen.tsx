import { View } from 'react-native';

import { SubscriptionPlansCard } from '@/features/billing/components/SubscriptionPlansCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { planForClinicCount } from '@/shared/catalog/subscription-plans';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useLocaleStore } from '@/shared/stores';

export function AdminPlansScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const clinicsQuery = useUserClinicsQuery();
  const clinicCount = clinicsQuery.data?.length ?? 0;
  const clinics = clinicsQuery.data ?? [];
  const hasCenter = clinics.some((clinic) => clinic.placeKind === 'center');
  const activePlan = planForClinicCount(clinicCount, hasCenter);
  const ar = locale === 'ar';

  return (
    <Screen scroll>
      <Header showBack title={ar ? 'أسعار الباقات' : 'Plans'} />
      <View className="gap-4 pb-10">
        <Text variant="bodySm" muted>
          {ar ? 'الباقة بتتحدد حسب حجم العيادة وعدد الفروع.' : 'Your plan is based on clinic size and branch count.'}
        </Text>
        <SubscriptionPlansCard activeId={activePlan} />
      </View>
    </Screen>
  );
}
