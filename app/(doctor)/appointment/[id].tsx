import { AppointmentDetailScreen } from '@/features/appointments/screens/AppointmentDetailScreen';
import { UserRole } from '@/shared/types/enums';

export default function DoctorAppointmentDetailRoute() {
  return <AppointmentDetailScreen viewerRole={UserRole.DOCTOR} />;
}
