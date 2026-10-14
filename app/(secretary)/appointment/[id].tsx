import { AppointmentDetailScreen } from '@/features/appointments/screens/AppointmentDetailScreen';
import { UserRole } from '@/shared/types/enums';

export default function SecretaryAppointmentDetailRoute() {
  return <AppointmentDetailScreen viewerRole={UserRole.SECRETARY} />;
}
