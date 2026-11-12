import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';

interface SettingsNavRowProps {
  title: string;
  subtitle: string;
  icon: AppIconName;
  href: Href;
}

export function SettingsNavRow({ title, subtitle, icon, href }: SettingsNavRowProps) {
  const { forwardIconName, rowStyle } = useLayoutDirection();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      className="active:opacity-80"
      onPress={() => router.push(href)}
    >
      <Card className="flex-row items-center gap-3" style={rowStyle}>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
          <Icon name={icon} size={18} color="#0D9488" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="titleSm">{title}</Text>
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        </View>
        <Icon name={forwardIconName} size={18} color="#94A3B8" />
      </Card>
    </Pressable>
  );
}
