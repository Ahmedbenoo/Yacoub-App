import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import { UserRole } from '@/shared/types/enums';

export default function PatientAppointmentsScreen() {
  return (
    <AppointmentsListScreen
      viewerRole={UserRole.PATIENT}
      showStatusFilter
    />
  );
}
