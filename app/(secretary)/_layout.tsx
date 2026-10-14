import { Stack } from 'expo-router';

import { useAuthGuard } from '@/shared/navigation/guards';
import { UserRole } from '@/shared/types/enums';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function SecretaryLayout() {
  useAuthGuard(UserRole.SECRETARY);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="appointment/[id]" />
      <Stack.Screen name="queue" />
      <Stack.Screen name="day-close" />
      <Stack.Screen name="patient/create" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="prescriptions/[id]" />
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
