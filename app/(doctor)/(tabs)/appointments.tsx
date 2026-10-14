import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import { UserRole } from '@/shared/types/enums';

export default function DoctorAppointmentsScreen() {
  return (
    <AppointmentsListScreen
      viewerRole={UserRole.DOCTOR}
      compactTitle
      showStatusFilter
    />
  );
}
