import { HomeVisitGate } from '@/features/home-visit/components/HomeVisitGate';
import { PatientHomeVisitDetailScreen } from '@/features/home-visit/screens/PatientHomeVisitDetailScreen';

export default function PatientHomeVisitDetailRoute() {
  return (
    <HomeVisitGate>
      <PatientHomeVisitDetailScreen />
    </HomeVisitGate>
  );
}
