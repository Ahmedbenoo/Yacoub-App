import { Stack } from 'expo-router';

import { useAuthGuard } from '@/shared/navigation/guards';
import { UserRole } from '@/shared/types/enums';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function NursingAdminLayout() {
  useAuthGuard(UserRole.NURSING_ADMIN);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request/[id]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
