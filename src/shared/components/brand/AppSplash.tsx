import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const logo = require('../../../../assets/images/logo-yacoub.png');

export function AppSplash() {
  const progress = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.18,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <View style={styles.root}>
      <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="Yacoub" />
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 48,
  },
  logo: {
    width: 240,
    height: 88,
  },
  track: {
    marginTop: 32,
    width: 136,
    height: 3,
    overflow: 'hidden',
    borderRadius: 99,
    backgroundColor: '#E6F7F5',
  },
  bar: {
    height: 3,
    borderRadius: 99,
    backgroundColor: '#0D9488',
  },
});
