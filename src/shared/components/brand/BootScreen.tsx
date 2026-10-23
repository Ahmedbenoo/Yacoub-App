import { ActivityIndicator, View } from 'react-native';

import { Logo } from '@/shared/components/brand/Logo';

export function BootScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        gap: 28,
      }}
    >
      <Logo maxVisibleHeight={96} />
      <ActivityIndicator color="#0D9488" />
    </View>
  );
}
