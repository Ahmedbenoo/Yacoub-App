import { Pressable, type PressableProps } from 'react-native';
import { router, type Href } from 'expo-router';

interface HrefPressableProps extends Omit<PressableProps, 'onPress'> {
  href?: Href;
  onPress?: PressableProps['onPress'];
}

export function HrefPressable({
  href,
  onPress,
  disabled,
  accessibilityRole,
  ...props
}: HrefPressableProps) {
  const interactive = Boolean(href || onPress);

  return (
    <Pressable
      {...props}
      disabled={disabled ?? !interactive}
      accessibilityRole={accessibilityRole ?? (interactive ? 'button' : undefined)}
      onPress={(event) => {
        onPress?.(event);
        if (href) {
          router.push(href);
        }
      }}
    />
  );
}
