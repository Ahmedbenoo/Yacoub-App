import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoleTabsShell } from '@/shared/components/layout/RoleTabsShell';
import { RoleTabBar, type RoleTabBarProps } from '@/shared/navigation/RoleTabBar';
import { createTabBarIcon, useTabBarScreenOptions } from '@/shared/navigation/tab-bar-options';

export default function AdminTabsLayout() {
  const { t } = useTranslation('admin');
  const screenOptions = useTabBarScreenOptions();

  return (
    <RoleTabsShell
      notificationsRoute="/(admin)/notifications"
      profileRoute="/(admin)/(tabs)/more"
    >
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
          name="dashboard"
          options={{ title: t('tabs.dashboard'), tabBarIcon: createTabBarIcon('dashboard') }}
        />
        <Tabs.Screen
          name="doctors"
          options={{ title: t('tabs.doctors'), tabBarIcon: createTabBarIcon('doctors') }}
        />
        <Tabs.Screen
          name="patients"
          options={{ title: t('tabs.patients'), tabBarIcon: createTabBarIcon('patients') }}
        />
        <Tabs.Screen
          name="appointments"
          options={{ title: t('tabs.appointments'), tabBarIcon: createTabBarIcon('calendar') }}
        />
        <Tabs.Screen
          name="more"
          options={{ title: t('tabs.more'), tabBarIcon: createTabBarIcon('more') }}
        />
      </Tabs>
    </RoleTabsShell>
  );
}
