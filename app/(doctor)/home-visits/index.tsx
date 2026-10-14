import { DoctorHomeVisitListScreen } from '@/features/home-visit/screens/DoctorHomeVisitListScreen';
import { HomeVisitGate } from '@/features/home-visit/components/HomeVisitGate';

export default function DoctorHomeVisitListRoute() {
  return (
    <HomeVisitGate>
      <DoctorHomeVisitListScreen />
    </HomeVisitGate>
  );
}
