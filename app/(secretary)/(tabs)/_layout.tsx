import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoleTabsShell } from '@/shared/components/layout/RoleTabsShell';
import { RoleTabBar, type RoleTabBarProps } from '@/shared/navigation/RoleTabBar';
import { createTabBarIcon, useTabBarScreenOptions } from '@/shared/navigation/tab-bar-options';

export default function SecretaryTabsLayout() {
  const { t } = useTranslation('secretary');
  const screenOptions = useTabBarScreenOptions();

  return (
    <RoleTabsShell
      notificationsRoute="/(secretary)/notifications"
      profileRoute="/(secretary)/(tabs)/profile"
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
