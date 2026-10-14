import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text variant="titleLg" className="mb-2">
            Page Not Found
          </Text>
          <Link href="/">
            <Text variant="label" className="text-primary-600">
              Go Home
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
