import { createElement, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const logo = require('../../../../assets/images/logo-yacoub.png') as
  | number
  | string
  | { uri?: string; default?: string };

function logoUri(): string {
  if (typeof logo === 'string') return logo;
  if (typeof logo === 'object' && typeof logo?.uri === 'string') return logo.uri;
  if (typeof logo === 'object' && typeof logo?.default === 'string') return logo.default;
  return '';
}

const ECG_BOX = 152;
const ECG_VIEWBOX = 120;
const ECG_SCALE = ECG_BOX / ECG_VIEWBOX;
const ECG_POINTS = [
  [8, 64],
  [28, 64],
  [36, 64],
  [44, 28],
  [54, 92],
  [64, 52],
  [70, 64],
  [112, 64],
].map(([x, y]) => [x * ECG_SCALE, y * ECG_SCALE] as const);
const ECG_STROKE = 2.2 * ECG_SCALE;

const WEB_LOADER_CSS = `
.app-web-loader {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 42%, #99f6e4 0%, transparent 42%),
    linear-gradient(180deg, #042f2e 0%, #023c37 55%, #012924 100%);
  font-family: Cairo, Tahoma, sans-serif;
}
.app-web-loader * { box-sizing: border-box; }
.app-web-loader .loader-inner {
  display: grid;
  justify-items: center;
  gap: 22px;
  width: min(280px, 78vw);
}
.app-web-loader .loader-mark {
  position: relative;
  width: 168px;
  height: 168px;
  display: grid;
  place-items: center;
}
.app-web-loader .loader-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(94, 234, 212, 0.18);
}
.app-web-loader .loader-ring::after {
  content: "";
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 1px solid rgba(94, 234, 212, 0.08);
  animation: yacoub-loader-breathe 2.4s ease-in-out infinite;
}
.app-web-loader .loader-ecg {
  position: absolute;
  inset: 8px;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  transform: rotate(-8deg);
}
.app-web-loader .loader-ecg path {
  fill: none;
  stroke: #5eead4;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 280;
  stroke-dashoffset: 280;
  animation: yacoub-loader-draw 1.6s ease-out 0.2s forwards, yacoub-loader-pulse 1.8s ease-in-out 1.8s infinite;
  filter: drop-shadow(0 0 8px rgba(94, 234, 212, 0.55));
}
.app-web-loader .loader-logo {
  position: relative;
  z-index: 1;
  width: 118px;
  background: #fff;
  border-radius: 22px;
  padding: 10px 12px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  animation: yacoub-loader-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.app-web-loader .loader-word {
  color: #ecfdf5;
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: 13px;
  opacity: 0;
  animation: yacoub-loader-fade 0.6s ease 0.55s forwards;
}
.app-web-loader .loader-bar {
  width: 100%;
  height: 3px;
  border-radius: 99px;
  background: rgba(204, 251, 241, 0.16);
  overflow: hidden;
}
.app-web-loader .loader-bar i {
  display: block;
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #14b8a6, #ccfbf1);
  animation: yacoub-loader-fill 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes yacoub-loader-draw { to { stroke-dashoffset: 0; } }
@keyframes yacoub-loader-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
@keyframes yacoub-loader-breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes yacoub-loader-rise {
  from { transform: translateY(12px) scale(0.92); opacity: 0; }
  to { transform: none; opacity: 1; }
}
@keyframes yacoub-loader-fade { to { opacity: 0.78; } }
@keyframes yacoub-loader-fill { to { width: 100%; } }
@media (prefers-reduced-motion: reduce) {
  .app-web-loader .loader-ecg path,
  .app-web-loader .loader-ring::after,
  .app-web-loader .loader-logo,
  .app-web-loader .loader-word,
  .app-web-loader .loader-bar i { animation: none; }
  .app-web-loader .loader-ecg path { stroke-dashoffset: 0; }
  .app-web-loader .loader-bar i { width: 100%; }
  .app-web-loader .loader-logo,
  .app-web-loader .loader-word { opacity: 1; }
}
`;

function WebAppSplash() {
  return (
    <View style={styles.webRoot}>
      <StatusBar style="light" />
      {createElement(
        'div',
        { className: 'app-web-loader', role: 'status', 'aria-label': 'جاري تحميل يعقوب' },
        createElement('style', { dangerouslySetInnerHTML: { __html: WEB_LOADER_CSS } }),
        createElement(
          'div',
          { className: 'loader-inner' },
          createElement(
            'div',
            { className: 'loader-mark' },
            createElement('span', { className: 'loader-ring' }),
            createElement(
              'svg',
              { className: 'loader-ecg', viewBox: '0 0 120 120', 'aria-hidden': 'true' },
              createElement('path', { d: 'M8 64 H28 L36 64 L44 28 L54 92 L64 52 L70 64 H112' }),
            ),
            createElement('img', { className: 'loader-logo', src: logoUri(), alt: 'يعقوب' }),
          ),
          createElement('div', { className: 'loader-word' }, 'YACOUB'),
          createElement('div', { className: 'loader-bar', 'aria-hidden': 'true' }, createElement('i')),
        ),
      )}
    </View>
  );
}

function EcgLine() {
  return (
    <View style={styles.ecgCanvas} pointerEvents="none">
      {ECG_POINTS.slice(1).map((point, index) => {
        const [x1, y1] = ECG_POINTS[index];
        const [x2, y2] = point;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`${x1}-${y1}-${x2}-${y2}`}
            style={[
              styles.ecgSegment,
              {
                width: length,
                left: (x1 + x2) / 2 - length / 2,
                top: (y1 + y2) / 2 - ECG_STROKE / 2,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function NativeAppSplash() {
  const ring = useRef(new Animated.Value(0)).current;
  const logoRise = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const ecgDraw = useRef(new Animated.Value(0)).current;
  const ecgPulse = useRef(new Animated.Value(0.55)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const apply = (enabled: boolean) => setReduceMotion(enabled);
    void AccessibilityInfo.isReduceMotionEnabled().then(apply);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      logoRise.setValue(1);
      word.setValue(1);
      bar.setValue(1);
      ecgDraw.setValue(1);
      ecgPulse.setValue(1);
      return;
    }

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ecgPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ecgPulse, {
          toValue: 0.55,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel([
      Animated.timing(logoRise, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(word, {
        toValue: 1,
        duration: 600,
        delay: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bar, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false,
      }),
      Animated.timing(ecgDraw, {
        toValue: 1,
        duration: 1600,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) pulse.start();
    });

    breathe.start();
    return () => {
      breathe.stop();
      pulse.stop();
    };
  }, [bar, ecgDraw, ecgPulse, logoRise, reduceMotion, ring, word]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="جاري تحميل يعقوب">
      <StatusBar style="light" />
      <View style={styles.glow} />
      <View style={styles.inner}>
        <View style={styles.mark}>
          <View style={styles.ring} />
          <Animated.View
            style={[
              styles.ringOuter,
              {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
                transform: [
                  {
                    scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ecgClip,
              {
                opacity: ecgPulse,
                width: ecgDraw.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, ECG_BOX],
                }),
              },
            ]}
          >
            <View style={styles.ecgTilt}>
              <EcgLine />
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: logoRise,
                transform: [
                  {
                    translateY: logoRise.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                  {
                    scale: logoRise.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={logo as number} style={styles.logo} resizeMode="contain" accessibilityLabel="يعقوب" />
          </Animated.View>
        </View>
        <Animated.Text
          style={[
            styles.word,
            {
              opacity: word.interpolate({ inputRange: [0, 1], outputRange: [0, 0.78] }),
            },
          ]}
        >
          YACOUB
        </Animated.Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.bar,
              {
                width: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export function AppSplash() {
  if (Platform.OS === 'web') {
    return <WebAppSplash />;
  }
  return <NativeAppSplash />;
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: '#023c37',
  },
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
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 84,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
  },
  ringOuter: {
    position: 'absolute',
    top: -10,
    right: -10,
    bottom: -10,
    left: -10,
    borderRadius: 94,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.08)',
  },
  ecgClip: {
    position: 'absolute',
    top: 8,
    left: 8,
    height: ECG_BOX,
    overflow: 'hidden',
  },
  ecgTilt: {
    width: ECG_BOX,
    height: ECG_BOX,
    transform: [{ rotate: '-8deg' }],
  },
  ecgCanvas: {
    width: ECG_BOX,
    height: ECG_BOX,
  },
  ecgSegment: {
    position: 'absolute',
    height: ECG_STROKE,
    borderRadius: 99,
    backgroundColor: '#5eead4',
    ...Platform.select({
      ios: {
        shadowColor: '#5eead4',
        shadowOpacity: 0.55,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  logoCard: {
    zIndex: 1,
    width: 118,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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
    width: 94,
    height: 35,
  },
  word: {
    color: '#ecfdf5',
    fontFamily: 'Cairo-Bold',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2.3,
  },
  track: {
    width: '100%',
    height: 3,
    overflow: 'hidden',
    borderRadius: 99,
    backgroundColor: 'rgba(204, 251, 241, 0.16)',
  },
  bar: {
    height: 3,
    borderRadius: 99,
    backgroundColor: '#14b8a6',
  },
});
