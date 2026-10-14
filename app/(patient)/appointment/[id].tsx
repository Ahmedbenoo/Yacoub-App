import { AppointmentDetailScreen } from '@/features/appointments/screens/AppointmentDetailScreen';
import { UserRole } from '@/shared/types/enums';

export default function PatientAppointmentDetailRoute() {
  return <AppointmentDetailScreen viewerRole={UserRole.PATIENT} />;
}
