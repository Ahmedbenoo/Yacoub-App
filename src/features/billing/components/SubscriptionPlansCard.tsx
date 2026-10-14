import { View } from 'react-native';

import {
  annualPrice,
  formatEgp,
  SUBSCRIPTION_NOTE,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '@/shared/catalog/subscription-plans';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { useLocaleStore } from '@/shared/stores';

interface SubscriptionPlansCardProps {
  activeId?: SubscriptionPlanId;
  onlyId?: SubscriptionPlanId;
}

export function SubscriptionPlansCard({ activeId, onlyId }: SubscriptionPlansCardProps) {
  const locale = useLocaleStore((state) => state.locale);
  const lang = locale === 'ar' ? 'ar' : 'en';
  const plans = onlyId ? SUBSCRIPTION_PLANS.filter((plan) => plan.id === onlyId) : SUBSCRIPTION_PLANS;

  return (
    <Card className="items-center gap-3">
      <Text variant="titleSm" className="w-full text-center" style={{ alignSelf: 'stretch' }}>
        {lang === 'ar' ? 'أسعار الباقات' : 'Plans'}
      </Text>
      {plans.map((plan) => {
        const active = plan.id === activeId;
        return (
          <View
            key={plan.id}
            className={`w-full items-center gap-1 rounded-xl px-3 py-2 ${active ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
          >
            <Text variant="bodySm" className="w-full text-center" style={{ alignSelf: 'stretch' }}>
              {plan.name[lang]} — {formatEgp(plan.monthly)} / {lang === 'ar' ? 'شهر' : 'month'}
            </Text>
            <Text variant="caption" muted className="w-full text-center" style={{ alignSelf: 'stretch' }}>
              {lang === 'ar' ? 'السنوي' : 'Annual'} {formatEgp(annualPrice(plan.monthly))}
            </Text>
            <Text variant="caption" muted className="w-full text-center" style={{ alignSelf: 'stretch' }}>
              {plan.detail[lang]}
            </Text>
            {active ? (
              <Text
                variant="caption"
                className="w-full text-center text-primary-700 dark:text-primary-300"
                style={{ alignSelf: 'stretch' }}
              >
                {lang === 'ar' ? 'باقتك الحالية' : 'Your current plan'}
              </Text>
            ) : null}
          </View>
        );
      })}
      <Text variant="caption" muted className="w-full text-center" style={{ alignSelf: 'stretch' }}>
        {SUBSCRIPTION_NOTE[lang]}
      </Text>
    </Card>
  );
}
