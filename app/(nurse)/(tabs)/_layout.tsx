import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoleTabsShell } from '@/shared/components/layout/RoleTabsShell';
import { RoleTabBar, type RoleTabBarProps } from '@/shared/navigation/RoleTabBar';
import { createTabBarIcon, useTabBarScreenOptions } from '@/shared/navigation/tab-bar-options';

export default function NurseTabsLayout() {
  const { t } = useTranslation('nursing');
  const screenOptions = useTabBarScreenOptions();

  return (
    <RoleTabsShell notificationsRoute="/(nurse)/(tabs)/orders" profileRoute="/(nurse)/(tabs)/profile">
      <Tabs
        screenOptions={screenOptions}
        tabBar={(props) => (
          <RoleTabBar
            state={props.state}
            descriptors={props.descriptors}
            navigation={props.navigation as RoleTabBarProps['navigation']}
          />
        )}
      >
        <Tabs.Screen
          name="orders"
          options={{ title: t('tabs.orders'), tabBarIcon: createTabBarIcon('calendar') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('tabs.profile'), tabBarIcon: createTabBarIcon('profile') }}
        />
      </Tabs>
    </RoleTabsShell>
  );
}
