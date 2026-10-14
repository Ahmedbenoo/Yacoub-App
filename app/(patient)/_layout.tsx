import { Stack } from 'expo-router';

import { usePatientAreaGuard } from '@/shared/navigation/guards';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function PatientLayout() {
  usePatientAreaGuard();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="nursing/index" />
      <Stack.Screen name="nursing/new" />
      <Stack.Screen name="nursing/[id]" />
      <Stack.Screen name="home-visit/index" />
      <Stack.Screen name="home-visit/new" />
      <Stack.Screen name="home-visit/[id]" />
      <Stack.Screen name="appointment/[id]" />
      <Stack.Screen name="doctors/[id]" />
      <Stack.Screen name="doctors/[id]/book" />
      <Stack.Screen name="clinics/[id]" />
      <Stack.Screen name="visit/[id]" />
      <Stack.Screen name="child/[id]" />
      <Stack.Screen name="prescriptions/index" />
      <Stack.Screen name="prescription/[id]" />
      <Stack.Screen name="lab-results/index" />
      <Stack.Screen name="lab-result/[id]" />
      <Stack.Screen name="health-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
