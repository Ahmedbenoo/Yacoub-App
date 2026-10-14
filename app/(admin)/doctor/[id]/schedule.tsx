import { AvailabilityScreen } from '@/features/doctor/screens/AvailabilityScreen';
import { useRouteIdParam } from '@/shared/navigation/routes';

export default function AdminDoctorScheduleRoute() {
  const id = useRouteIdParam();
  return <AvailabilityScreen doctorId={id} />;
}
