import { HomeVisitGate } from '@/features/home-visit/components/HomeVisitGate';
import { PatientHomeVisitListScreen } from '@/features/home-visit/screens/PatientHomeVisitListScreen';

export default function PatientHomeVisitListRoute() {
  return (
    <HomeVisitGate>
      <PatientHomeVisitListScreen />
    </HomeVisitGate>
  );
}
