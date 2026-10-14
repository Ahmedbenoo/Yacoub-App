import { NotificationsScreen } from '@/features/appointments/screens/NotificationsScreen';
import { UserRole } from '@/shared/types/enums';

export default function SecretaryNotificationsRoute() {
  return <NotificationsScreen viewerRole={UserRole.SECRETARY} />;
}
