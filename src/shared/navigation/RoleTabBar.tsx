import { Pressable, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { TAB_BAR_METRICS } from '@/shared/navigation/tab-bar-options';
import { useLocaleStore } from '@/shared/stores';
import { getTypedFontStyle } from '@/shared/theme/fonts';

interface TabRoute {
  key: string;
  name: string;
  params?: object;
}

export interface RoleTabBarProps {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarLabel?: unknown;
        tabBarIcon?: (props: {
          focused: boolean;
          color: string;
          size: number;
        }) => React.ReactNode;
        tabBarAccessibilityLabel?: string;
      };
    }
  >;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
}

function getTabLabel(
  options: RoleTabBarProps['descriptors'][string]['options'],
  routeName: string,
): string {
  if (typeof options.tabBarLabel === 'string') {
    return options.tabBarLabel;
  }

  if (options.title) {
    return options.title;
  }

  return routeName;
}

export function RoleTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: RoleTabBarProps['state'];
  descriptors: RoleTabBarProps['descriptors'];
  navigation: RoleTabBarProps['navigation'];
}) {
  const insets = useSafeAreaInsets();
  const isRtl = useLocaleStore((s) => s.isRtl);
  const isDark = useResolvedColorScheme() === 'dark';
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_METRICS.minBottomInset);

  return (
    <View
      style={{
        flexDirection: 'row',
        direction: isRtl ? 'rtl' : 'ltr',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#E2E8F0',
        paddingTop: TAB_BAR_METRICS.topPadding,
        paddingBottom: bottomPadding,
        paddingHorizontal: TAB_BAR_METRICS.horizontalPadding,
        flexShrink: 0,
        ...(Platform.OS === 'web' ? { minHeight: TAB_BAR_METRICS.webBarHeight } : undefined),
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = getTabLabel(options, route.name);
        const isFocused = state.index === index;
        const color = isFocused ? '#0D9488' : isDark ? '#94A3B8' : '#64748B';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color,
          size: TAB_BAR_METRICS.iconSize,
        });

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: TAB_BAR_METRICS.contentHeight,
            }}
          >
            {icon}
            <Text
              style={{
                marginTop: TAB_BAR_METRICS.labelMarginTop,
                fontSize: TAB_BAR_METRICS.labelFontSize,
                lineHeight: TAB_BAR_METRICS.labelLineHeight,
                color,
                textAlign: 'center',
                ...getTypedFontStyle(isRtl, '600'),
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
