export type SubscriptionPlanId = 'clinic' | 'center' | 'network';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  monthly: number;
  name: { ar: string; en: string };
  detail: { ar: string; en: string };
  features: { ar: string[]; en: string[] };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'clinic',
    monthly: 1000,
    name: { ar: 'عيادة', en: 'Clinic' },
    detail: {
      ar: 'فرع واحد، لحد 3 دكاترة، وسكرتارية بلا حد',
      en: 'One branch, up to 3 doctors, and unlimited secretaries',
    },
    features: {
      ar: ['فرع واحد', 'حتى 3 دكاترة', 'سكرتارية بلا حد'],
      en: ['One branch', 'Up to 3 doctors', 'Unlimited secretaries'],
    },
  },
  {
    id: 'center',
    monthly: 1800,
    name: { ar: 'مركز', en: 'Center' },
    detail: {
      ar: 'لحد فرعين. الفرع الجديد يفضل معلّق لحد الاعتماد',
      en: 'Up to two branches. A new branch stays pending until approval',
    },
    features: {
      ar: ['حتى فرعين', 'الفرع الجديد معلّق لحين الاعتماد', 'سكرتارية بلا حد'],
      en: ['Up to two branches', 'New branch stays pending until approval', 'Unlimited secretaries'],
    },
  },
  {
    id: 'network',
    monthly: 2900,
    name: { ar: 'أكتر من فرعين', en: 'More than two branches' },
    detail: {
      ar: 'تقارير كل الفروع، وموظفين الحسابات',
      en: 'Reports for every branch, plus accounts staff',
    },
    features: {
      ar: ['كل الفروع', 'تقارير مجمّعة للفروع', 'موظفين الحسابات'],
      en: ['All branches', 'Combined branch reports', 'Accounts staff'],
    },
  },
];

export const SUBSCRIPTION_NOTE = {
  ar: 'من غير رسوم تأسيس. السنوي بسعر 10 شهور.',
  en: 'No setup fee. Annual price is 10 months.',
};

export function annualPrice(monthly: number): number {
  return monthly * 10;
}

export function formatEgp(amount: number): string {
  return `${amount.toLocaleString('en-US')} ج.م`;
}

export function planForClinicCount(count: number, hasCenter: boolean): SubscriptionPlanId {
  if (count > 2) return 'network';
  if (hasCenter) return 'center';
  return 'clinic';
}

export function planById(id: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? SUBSCRIPTION_PLANS[0];
}
