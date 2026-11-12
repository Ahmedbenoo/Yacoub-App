import { View } from 'react-native';

import { SubscriptionPlansCard } from '@/features/billing/components/SubscriptionPlansCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { planForClinicCount, SUBSCRIPTION_NOTE } from '@/shared/catalog/subscription-plans';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
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
  const lang = ar ? 'ar' : 'en';

  return (
    <Screen scroll>
      <Header showBack title={ar ? 'أسعار الباقات' : 'Plans'} />
      <View className="gap-5 pb-10">
        <Text variant="bodySm" muted>
          {ar
            ? 'الباقة بتتحدد تلقائيًا حسب حجم المكان وعدد الفروع.'
            : 'Your plan is set automatically from clinic size and branch count.'}
        </Text>
        <SubscriptionPlansCard activeId={activePlan} />
        <Card className="gap-1 bg-slate-50 dark:bg-slate-800/60">
          <Text variant="caption" muted>
            {SUBSCRIPTION_NOTE[lang]}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
