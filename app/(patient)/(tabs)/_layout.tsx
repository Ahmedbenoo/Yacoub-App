import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RoleTabsShell } from '@/shared/components/layout/RoleTabsShell';
import { RoleTabBar, type RoleTabBarProps } from '@/shared/navigation/RoleTabBar';
import { createTabBarIcon, useTabBarScreenOptions } from '@/shared/navigation/tab-bar-options';

export default function PatientTabsLayout() {
  const { t } = useTranslation('patient');
  const screenOptions = useTabBarScreenOptions();

  return (
    <RoleTabsShell
      notificationsRoute="/(patient)/notifications"
      profileRoute="/(patient)/(tabs)/profile"
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
          name="home"
          options={{ title: t('tabs.home'), tabBarIcon: createTabBarIcon('home') }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: t('tabs.search'), tabBarIcon: createTabBarIcon('search') }}
        />
        <Tabs.Screen
          name="appointments"
          options={{ title: t('tabs.appointments'), tabBarIcon: createTabBarIcon('calendar') }}
        />
        <Tabs.Screen
          name="records"
          options={{ title: t('tabs.records'), tabBarIcon: createTabBarIcon('records') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('tabs.more'), tabBarIcon: createTabBarIcon('more') }}
        />
      </Tabs>
    </RoleTabsShell>
  );
}
