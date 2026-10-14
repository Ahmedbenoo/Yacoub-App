import { Stack } from 'expo-router';

import { useAuthGuard } from '@/shared/navigation/guards';
import { UserRole } from '@/shared/types/enums';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function DoctorLayout() {
  useAuthGuard(UserRole.DOCTOR);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="appointment/[id]" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="child/[id]" />
      <Stack.Screen name="visits/[id]" />
      <Stack.Screen name="prescriptions/[id]" />
      <Stack.Screen name="lab-results/[id]" />
      <Stack.Screen name="home-visits/index" />
      <Stack.Screen name="home-visits/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
