import { Stack } from 'expo-router';

import { useAuthGuard } from '@/shared/navigation/guards';
import { UserRole } from '@/shared/types/enums';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AdminLayout() {
  useAuthGuard(UserRole.ADMIN);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="appointment/[id]" />
      <Stack.Screen name="queue" />
      <Stack.Screen name="day-close" />
      <Stack.Screen name="doctor/[id]" />
      <Stack.Screen name="doctor/[id]/edit" />
      <Stack.Screen name="doctor/[id]/schedule" />
      <Stack.Screen name="doctor/create" />
      <Stack.Screen name="secretary/create" />
      <Stack.Screen name="clinic/create" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="schedules" />
      <Stack.Screen name="clinic-page" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="patient/[id]/edit" />
      <Stack.Screen name="patient/create" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="reports/[id]" />
      <Stack.Screen name="reports/index" />
      <Stack.Screen name="visits/[id]" />
      <Stack.Screen name="prescriptions/[id]" />
      <Stack.Screen name="lab-results/[id]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
