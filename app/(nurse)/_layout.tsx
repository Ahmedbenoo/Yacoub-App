import { Stack } from 'expo-router';

import { useAuthGuard } from '@/shared/navigation/guards';
import { UserRole } from '@/shared/types/enums';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function NurseLayout() {
  useAuthGuard(UserRole.NURSE);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request/[id]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
