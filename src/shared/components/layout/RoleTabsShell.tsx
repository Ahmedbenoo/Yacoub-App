import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { TabTopBar } from '@/shared/components/layout/TabTopBar';

interface RoleTabsShellProps {
  notificationsRoute: string;
  profileRoute: string;
  children: ReactNode;
}

const webLockStyle = Platform.OS === 'web' ? { height: '100%', overflow: 'hidden' as const, minHeight: 0 } : undefined;

/** Shared shell for doctor/patient/admin tab layouts — identical nav sizing. */
export function RoleTabsShell({ notificationsRoute, profileRoute, children }: RoleTabsShellProps) {
  return (
    <View className="flex-1" style={[{ flex: 1 }, webLockStyle]}>
      <TabTopBar notificationsRoute={notificationsRoute} profileRoute={profileRoute} />
      <View className="flex-1" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}
