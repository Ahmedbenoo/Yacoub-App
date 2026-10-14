import { DoctorHomeVisitDetailScreen } from '@/features/home-visit/screens/DoctorHomeVisitDetailScreen';
import { HomeVisitGate } from '@/features/home-visit/components/HomeVisitGate';

export default function DoctorHomeVisitDetailRoute() {
  return (
    <HomeVisitGate>
      <DoctorHomeVisitDetailScreen />
    </HomeVisitGate>
  );
}
