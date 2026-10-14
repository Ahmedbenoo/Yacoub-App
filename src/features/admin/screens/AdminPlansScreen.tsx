import { SubscriptionPlansCard } from '@/features/billing/components/SubscriptionPlansCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { planForClinicCount } from '@/shared/catalog/subscription-plans';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { useAuthStore } from '@/shared/stores';

export function AdminPlansScreen() {
  const userId = useAuthStore((state) => state.user?.id);
  const clinicsQuery = useUserClinicsQuery();
  const clinicCount = clinicsQuery.data?.length ?? 0;
  const activePlan = planForClinicCount(clinicCount, userId ? clinicsService.ownerHasCenter(userId) : false);

  return (
    <Screen scroll>
      <Header showBack title="أسعار الباقات" />
      <SubscriptionPlansCard activeId={activePlan} />
    </Screen>
  );
}
