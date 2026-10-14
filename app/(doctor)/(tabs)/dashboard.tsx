import { DoctorDashboardScreen } from '@/features/appointments/screens/DoctorDashboardScreen';

export default function DoctorDashboardRoute() {
  return (
    <DoctorDashboardScreen
      appointmentsRoute="/(doctor)/(tabs)/appointments"
      notificationsRoute="/(doctor)/notifications"
    />
  );
}
