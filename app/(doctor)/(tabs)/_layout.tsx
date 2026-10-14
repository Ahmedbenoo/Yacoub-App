import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoleTabsShell } from '@/shared/components/layout/RoleTabsShell';
import { RoleTabBar, type RoleTabBarProps } from '@/shared/navigation/RoleTabBar';
import { createTabBarIcon, useTabBarScreenOptions } from '@/shared/navigation/tab-bar-options';

export default function DoctorTabsLayout() {
  const { t } = useTranslation('doctor');
  const screenOptions = useTabBarScreenOptions();

  return (
    <RoleTabsShell
      notificationsRoute="/(doctor)/notifications"
      profileRoute="/(doctor)/(tabs)/profile"
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
          name="appointments"
          options={{ title: t('tabs.appointments'), tabBarIcon: createTabBarIcon('calendar') }}
        />
        <Tabs.Screen
          name="patients"
          options={{ title: t('tabs.patients'), tabBarIcon: createTabBarIcon('patients') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('tabs.profile'), tabBarIcon: createTabBarIcon('profile') }}
        />
      </Tabs>
    </RoleTabsShell>
  );
}
