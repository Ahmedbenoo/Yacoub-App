import { SubscriptionPlansCard } from '@/features/billing/components/SubscriptionPlansCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { planForClinicCount } from '@/shared/catalog/subscription-plans';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';

export function AdminPlansScreen() {
  const clinicsQuery = useUserClinicsQuery();
  const clinicCount = clinicsQuery.data?.length ?? 0;
  const clinics = clinicsQuery.data ?? [];
  const hasCenter = clinics.some((clinic) => clinic.placeKind === 'center');
  const activePlan = planForClinicCount(clinicCount, hasCenter);

  return (
    <Screen scroll>
      <Header showBack title="أسعار الباقات" />
      <SubscriptionPlansCard activeId={activePlan} />
    </Screen>
  );
}
