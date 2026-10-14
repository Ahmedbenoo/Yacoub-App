import { NotificationsScreen } from '@/features/appointments/screens/NotificationsScreen';
import { UserRole } from '@/shared/types/enums';

export default function AdminNotificationsRoute() {
  return <NotificationsScreen viewerRole={UserRole.ADMIN} />;
}
