import { PatientHomeScreen } from '@/features/appointments/screens/PatientHomeScreen';

export default function PatientHomeRoute() {
  return (
    <PatientHomeScreen
      appointmentsRoute="/(patient)/(tabs)/appointments"
      notificationsRoute="/(patient)/notifications"
    />
  );
}
