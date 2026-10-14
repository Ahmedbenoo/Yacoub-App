import { AppointmentDetailScreen } from '@/features/appointments/screens/AppointmentDetailScreen';
import { UserRole } from '@/shared/types/enums';

export default function AdminAppointmentDetailRoute() {
  return <AppointmentDetailScreen viewerRole={UserRole.ADMIN} />;
}
