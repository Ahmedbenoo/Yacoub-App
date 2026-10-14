import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import { UserRole } from '@/shared/types/enums';

export default function SecretaryAppointmentsScreen() {
  return <AppointmentsListScreen viewerRole={UserRole.SECRETARY} showStatusFilter />;
}
