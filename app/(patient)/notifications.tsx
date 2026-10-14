import { NotificationsScreen } from '@/features/appointments/screens/NotificationsScreen';
import { UserRole } from '@/shared/types/enums';

export default function PatientNotificationsRoute() {
  return <NotificationsScreen viewerRole={UserRole.PATIENT} />;
}
