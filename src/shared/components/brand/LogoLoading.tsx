import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

import { Logo } from '@/shared/components/brand/Logo';

type LogoLoadingSize = 'sm' | 'lg';

export function LogoLoading({ size = 'lg' }: { size?: LogoLoadingSize }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Logo size={size} />
    </Animated.View>
  );
}
