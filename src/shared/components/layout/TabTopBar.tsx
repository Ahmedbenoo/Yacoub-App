import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotificationsQuery } from '@/features/appointments/hooks/useNotificationQueries';
import { filterNotificationsByPreferences } from '@/features/appointments/lib/notifications';
import { NavBrand } from '@/shared/components/brand/NavBrand';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';
import { TAB_TOP_BAR_METRICS } from '@/shared/navigation/tab-top-bar-metrics';
import { useAuthStore, useLocaleStore, useThemeStore } from '@/shared/stores';
import { useNotificationPreferencesStore } from '@/shared/stores/notification-preferences-store';
import { ThemeMode } from '@/shared/types/enums';

interface TabTopBarProps {
  notificationsRoute?: string;
  profileRoute?: string;
}

interface NavIconButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
  children: ReactNode;
}

function NavIconButton({ onPress, accessibilityLabel, testID, children }: NavIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
      style={{
        width: TAB_TOP_BAR_METRICS.iconButtonSize,
        height: TAB_TOP_BAR_METRICS.iconButtonSize,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

export function TabTopBar({ notificationsRoute, profileRoute }: TabTopBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const isRtl = useLocaleStore((s) => s.isRtl);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const user = useAuthStore((s) => s.user);
  const isCategoryEnabled = useNotificationPreferencesStore((s) => s.isCategoryEnabled);
  const { data } = useNotificationsQuery(20);
  const unreadCount = filterNotificationsByPreferences(data?.data ?? [], isCategoryEnabled).filter(
    (n) => !n.readAt,
  ).length;

  const iconColor = isDark ? '#F8FAFC' : '#334155';

  const toggleTheme = () => {
    setThemeMode(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  const profileButton = profileRoute ? (
    <Pressable
      onPress={() => router.push((user ? profileRoute : '/(auth)/login') as never)}
      className="items-center justify-center rounded-full active:opacity-80"
      style={{
        width: TAB_TOP_BAR_METRICS.avatarSize,
        height: TAB_TOP_BAR_METRICS.avatarSize,
      }}
      accessibilityRole="button"
      accessibilityLabel={t('nav.profile')}
    >
      {user ? (
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          size="sm"
          imageUrl={user.avatarUrl}
          className="h-7 w-7"
        />
      ) : (
        <Icon name="profile" size={TAB_TOP_BAR_METRICS.iconSize} color={iconColor} />
      )}
    </Pressable>
  ) : null;

  const notificationButton = notificationsRoute && user ? (
    <NavIconButton
      onPress={() => router.push(notificationsRoute as never, { withAnchor: true })}
      accessibilityLabel={t('nav.notifications')}
      testID="notification-bell"
    >
      <View>
        <Icon name="bell" size={TAB_TOP_BAR_METRICS.iconSize} color={iconColor} />
        {unreadCount > 0 && (
          <View
            testID="notification-badge"
            className="absolute -right-0.5 -top-0.5 items-center justify-center rounded-full bg-orange-500"
            style={{
              width: TAB_TOP_BAR_METRICS.badgeSize,
              height: TAB_TOP_BAR_METRICS.badgeSize,
            }}
          >
            <Text
              variant="caption"
              className="text-center font-bold leading-none text-white"
              style={{
                fontSize: TAB_TOP_BAR_METRICS.badgeFontSize,
                lineHeight: TAB_TOP_BAR_METRICS.badgeSize,
                includeFontPadding: false,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </NavIconButton>
  ) : null;

  const themeButton = (
    <NavIconButton onPress={toggleTheme} accessibilityLabel={t('nav.theme')}>
      <Icon name={isDark ? 'sun' : 'moon'} size={TAB_TOP_BAR_METRICS.iconSize} color={iconColor} />
    </NavIconButton>
  );

  return (
    <View
      className={cn(
        'border-b',
        isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white',
      )}
      style={{
        paddingTop: insets.top,
        paddingBottom: TAB_TOP_BAR_METRICS.bottomPadding,
        paddingHorizontal: TAB_TOP_BAR_METRICS.horizontalPadding,
      }}
    >
      <View
        className="flex-row items-center justify-between"
        style={{
          direction: isRtl ? 'rtl' : 'ltr',
          minHeight: TAB_TOP_BAR_METRICS.contentHeight,
          height: TAB_TOP_BAR_METRICS.contentHeight,
        }}
      >
        <NavBrand />

        <View
          className="flex-row items-center"
          style={{ direction: 'ltr', gap: TAB_TOP_BAR_METRICS.actionsGap }}
        >
          {isRtl ? (
            <>
              {profileButton}
              {notificationButton}
              {themeButton}
            </>
          ) : (
            <>
              {themeButton}
              {notificationButton}
              {profileButton}
            </>
          )}
        </View>
      </View>
    </View>
  );
}
