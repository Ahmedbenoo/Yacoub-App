import { HomeVisitGate } from '@/features/home-visit/components/HomeVisitGate';
import { PatientHomeVisitRequestScreen } from '@/features/home-visit/screens/PatientHomeVisitRequestScreen';

export default function PatientHomeVisitRequestRoute() {
  return (
    <HomeVisitGate>
      <PatientHomeVisitRequestScreen />
    </HomeVisitGate>
  );
}
