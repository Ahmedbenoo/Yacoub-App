import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import { UserRole } from '@/shared/types/enums';

export default function AdminAppointmentsScreen() {
  return (
    <AppointmentsListScreen
      viewerRole={UserRole.ADMIN}
      showStatusFilter
    />
  );
}
