import { ActivityIndicator, View } from 'react-native';

import { Logo } from '@/shared/components/brand/Logo';

export function BootScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
      }}
    >
      <Logo maxVisibleHeight={48} />
      <ActivityIndicator color="#0D9488" style={{ marginTop: 18 }} />
    </View>
  );
}
