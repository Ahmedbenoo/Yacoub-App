import { View } from 'react-native';

import {
  annualPrice,
  formatEgp,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '@/shared/catalog/subscription-plans';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLocaleStore } from '@/shared/stores';

interface SubscriptionPlansCardProps {
  activeId?: SubscriptionPlanId;
  onlyId?: SubscriptionPlanId;
}

const PLAN_ICONS: Record<SubscriptionPlanId, AppIconName> = {
  clinic: 'clinic',
  center: 'doctors',
  network: 'star',
};

export function SubscriptionPlansCard({ activeId, onlyId }: SubscriptionPlansCardProps) {
  const locale = useLocaleStore((state) => state.locale);
  const lang = locale === 'ar' ? 'ar' : 'en';
  const plans = onlyId ? SUBSCRIPTION_PLANS.filter((plan) => plan.id === onlyId) : SUBSCRIPTION_PLANS;
  const monthLabel = lang === 'ar' ? 'شهر' : 'month';
  const yearLabel = lang === 'ar' ? 'سنويًا' : 'billed annually';
  const currentLabel = lang === 'ar' ? 'باقتك الحالية' : 'Current plan';

  return (
    <View className="gap-3">
      {plans.map((plan) => {
        const active = plan.id === activeId;
        return (
          <Card
            key={plan.id}
            className={`gap-3 overflow-hidden p-5 ${
              active ? 'border-[#0F766E] bg-[#F0FDFA] dark:border-primary-500 dark:bg-primary-900/20' : ''
            }`}
            style={active ? { borderWidth: 1.5 } : undefined}
          >
            <View className="flex-row items-center gap-3">
              <View
                className={`h-11 w-11 items-center justify-center rounded-2xl ${
                  active ? 'bg-[#0F766E]' : 'bg-[#F0FDFA] dark:bg-primary-900/40'
                }`}
              >
                <Icon name={PLAN_ICONS[plan.id]} size={20} color={active ? '#FFFFFF' : '#0F766E'} />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text variant="titleSm">{plan.name[lang]}</Text>
                {active ? (
                  <Text variant="caption" className="text-[#0F766E] dark:text-primary-300">
                    {currentLabel}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row items-end gap-1.5">
              <Text variant="titleMd">{formatEgp(plan.monthly)}</Text>
              <Text variant="caption" muted className="pb-0.5">
                / {monthLabel}
              </Text>
            </View>

            <Text variant="caption" muted>
              {formatEgp(annualPrice(plan.monthly))} {yearLabel}
            </Text>

            <Text variant="bodySm" muted>
              {plan.detail[lang]}
            </Text>
          </Card>
        );
      })}
    </View>
  );
}
