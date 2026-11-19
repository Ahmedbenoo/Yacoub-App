import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const logo = require('../../../../assets/images/logo-munjiz.png');
const ecg = require('../../../../assets/images/splash-ecg.png');

export function AppSplash({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const pulseDraw = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const apply = (enabled: boolean) => setReduceMotion(enabled);
    void AccessibilityInfo.isReduceMotionEnabled().then(apply);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulseDraw.setValue(1);
      fill.setValue(1);
      logoOpacity.setValue(1);
      onIntroComplete?.();
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const bar = Animated.timing(fill, {
      toValue: 1,
      duration: 2400,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    });
    bar.start();

    const draw = Animated.timing(pulseDraw, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    draw.start(({ finished }) => {
      if (!finished) return;
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished: logoDone }) => {
        if (logoDone) onIntroComplete?.();
      });
    });

    return () => {
      pulse.stop();
      bar.stop();
      draw.stop();
    };
  }, [breathe, fill, logoOpacity, onIntroComplete, pulseDraw, reduceMotion]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="جاري تحميل MUNJEZ MED">
      <StatusBar style="light" />
      <View style={styles.glow} />
      <View style={styles.inner}>
        <View style={styles.mark}>
          <View style={styles.ring} />
          <Animated.View
            style={[
              styles.ringOuter,
              {
                opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
                transform: [
                  {
                    scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.ecgClip}>
            <Animated.View
              style={[
                styles.ecgReveal,
                {
                  width: pulseDraw.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            >
              <Image source={ecg} style={styles.ecg} resizeMode="contain" />
            </Animated.View>
          </View>
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: logoOpacity,
                transform: [
                  {
                    translateY: logoOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="MUNJEZ MED" />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.word, { opacity: logoOpacity }]}>MUNJEZ MED</Animated.Text>
        <View style={styles.bar}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#023c37',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(153, 246, 228, 0.22)',
  },
  inner: {
    width: 280,
    maxWidth: '78%',
    alignItems: 'center',
    gap: 22,
  },
  mark: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
  },
  ringOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.08)',
  },
  ecgClip: {
    position: 'absolute',
    width: 220,
    height: 220,
    overflow: 'hidden',
  },
  ecgReveal: {
    height: 220,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  ecg: {
    width: 220,
    height: 220,
  },
  logoCard: {
    zIndex: 1,
    width: 176,
    alignItems: 'center',
    backgroundColor: '#E8F3F0',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 18 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  logo: {
    width: 152,
    height: 84,
  },
  word: {
    color: 'rgba(236, 253, 245, 0.78)',
    fontWeight: '800',
    letterSpacing: 2.3,
    fontSize: 13,
  },
  bar: {
    width: '100%',
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(204, 251, 241, 0.16)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#5eead4',
    alignSelf: 'flex-start',
  },
});
