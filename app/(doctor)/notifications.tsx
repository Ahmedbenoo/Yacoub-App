import { NotificationsScreen } from '@/features/appointments/screens/NotificationsScreen';
import { UserRole } from '@/shared/types/enums';

export default function DoctorNotificationsRoute() {
  return <NotificationsScreen viewerRole={UserRole.DOCTOR} />;
}
