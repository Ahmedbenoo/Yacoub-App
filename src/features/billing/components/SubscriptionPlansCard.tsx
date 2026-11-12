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
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';
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
  const isDark = useResolvedColorScheme() === 'dark';
  const { rowStyle } = useLayoutDirection();
  const lang = locale === 'ar' ? 'ar' : 'en';
  const plans = onlyId ? SUBSCRIPTION_PLANS.filter((plan) => plan.id === onlyId) : SUBSCRIPTION_PLANS;
  const monthLabel = lang === 'ar' ? 'شهر' : 'month';
  const yearLabel = lang === 'ar' ? 'سنويًا' : 'billed annually';
  const giftLabel = lang === 'ar' ? 'شهرين هدية' : '2 months free';
  const currentLabel = lang === 'ar' ? 'باقتك الحالية' : 'Current plan';

  return (
    <View className="gap-4">
      {plans.map((plan) => {
        const active = plan.id === activeId;
        return (
          <Card
            key={plan.id}
            elevated={active}
            className={cn(
              'overflow-hidden p-0',
              active
                ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
                : isDark
                  ? 'border-slate-700 bg-slate-800'
                  : 'border-slate-200 bg-white',
            )}
            style={active ? { borderWidth: 1.5 } : undefined}
          >
            {active ? (
              <View className="bg-primary-600 px-4 py-2">
                <Text variant="caption" className="text-center text-white" style={{ color: '#FFFFFF' }}>
                  {currentLabel}
                </Text>
              </View>
            ) : null}

            <View className="gap-4 p-5">
              <View className="items-center gap-3" style={rowStyle}>
                <View
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-2xl',
                    active ? 'bg-primary-600' : 'bg-primary-50 dark:bg-primary-900/40',
                  )}
                >
                  <Icon name={PLAN_ICONS[plan.id]} size={22} color={active ? '#FFFFFF' : '#0F766E'} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text variant="titleMd">{plan.name[lang]}</Text>
                </View>
              </View>

              <View className="items-end gap-1" style={rowStyle}>
                <Text variant="titleLg" className={cn(active && 'text-primary-700 dark:text-primary-300')}>
                  {formatEgp(plan.monthly)}
                </Text>
                <Text variant="bodySm" muted className="pb-1">
                  / {monthLabel}
                </Text>
              </View>

              <View
                className={cn(
                  'items-center justify-between gap-2 rounded-xl px-3 py-2',
                  active ? 'bg-white/80 dark:bg-slate-900/40' : 'bg-slate-50 dark:bg-slate-900/40',
                )}
                style={rowStyle}
              >
                <Text variant="caption" muted>
                  {formatEgp(annualPrice(plan.monthly))} {yearLabel}
                </Text>
                <Text variant="caption" className="text-primary-700 dark:text-primary-300">
                  {giftLabel}
                </Text>
              </View>

              <View className="gap-2.5">
                {plan.features[lang].map((feature) => (
                  <View key={feature} className="items-start gap-2.5" style={rowStyle}>
                    <View className="mt-1.5 h-2 w-2 rounded-full bg-primary-600" />
                    <Text variant="bodySm" className="min-w-0 flex-1">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
