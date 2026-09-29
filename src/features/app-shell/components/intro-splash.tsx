import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useEffectEvent, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTranslation } from '@/core/i18n';
import { colorOf, fonts } from '@/shared/theme';

import {
  LOGO_COLOR,
  LOGO_STROKE_WIDTH,
  LOGO_VIEWBOX,
  type LogoDot,
  type LogoLine,
  logoDots,
  logoLines,
  SPLASH_BACKGROUND,
  SPLASH_LOGO_HEIGHT,
} from '../lib/kronos-logo';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Timeline in ms, driven by a single clock. */
const TAGLINE_IN = { at: 150, duration: 450 };
const APART = { at: 700, stagger: 70, duration: 520 };
/** The four dots go together, right after the last line. */
const DOTS_AT = APART.at + logoLines.length * APART.stagger;
const TAGLINE_OUT = { at: 1500, duration: 300 };
const FADE_OUT = { at: 1650, duration: 350 };
export const INTRO_DURATION = FADE_OUT.at + FADE_OUT.duration;
/** With reduced motion the logo stays whole and the screen just fades. */
const REDUCED = { fadeAt: 1100, duration: 300 };

const LOGO_WIDTH = (SPLASH_LOGO_HEIGHT * LOGO_VIEWBOX.width) / LOGO_VIEWBOX.height;
const VIEWBOX = `${LOGO_VIEWBOX.x} ${LOGO_VIEWBOX.y} ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`;

/** 0→1 progress of a step that starts `at` and lasts `duration`, eased. */
function stepProgress(time: number, at: number, duration: number) {
  'worklet';
  const t = Math.min(1, Math.max(0, (time - at) / duration));
  return Easing.inOut(Easing.cubic)(t);
}

/**
 * Picks up where the native splash leaves off (same background, logo size and position), shows
 * the tagline and takes the logo apart line by line before revealing the app. Cold start only.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const clock = useSharedValue(0);
  const [started, setStarted] = useState(false);
  const total = reducedMotion ? REDUCED.fadeAt + REDUCED.duration : INTRO_DURATION;

  const finish = useEffectEvent(onDone);
  useEffect(() => {
    if (!started) return;
    clock.set(withTiming(total, { duration: total, easing: Easing.linear }));
    const timer = setTimeout(finish, total);
    return () => clearTimeout(timer);
  }, [started, total, clock]);

  // Swap the native splash for this identical-looking view only once it's on screen.
  const handleLayout = () => {
    if (started) return;
    SplashScreen.hideAsync().catch(() => {});
    setStarted(true);
  };

  const containerStyle = useAnimatedStyle(() => {
    const fade = reducedMotion
      ? stepProgress(clock.get(), REDUCED.fadeAt, REDUCED.duration)
      : stepProgress(clock.get(), FADE_OUT.at, FADE_OUT.duration);
    return { opacity: 1 - fade };
  });

  const taglineStyle = useAnimatedStyle(() => {
    const time = clock.get();
    const shown = stepProgress(time, TAGLINE_IN.at, TAGLINE_IN.duration);
    const hidden = reducedMotion ? 0 : stepProgress(time, TAGLINE_OUT.at, TAGLINE_OUT.duration);
    return {
      opacity: shown * (1 - hidden),
      transform: [{ translateY: (1 - shown) * 8 }],
    };
  });

  return (
    <Animated.View
      testID="intro-splash"
      pointerEvents="none"
      onLayout={handleLayout}
      style={[styles.container, containerStyle]}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('appName')}
        style={{ width: LOGO_WIDTH, height: SPLASH_LOGO_HEIGHT }}>
        <Svg width={LOGO_WIDTH} height={SPLASH_LOGO_HEIGHT} viewBox={VIEWBOX}>
          {logoLines.map((line, i) => (
            <ApartLine
              key={line.d}
              line={line}
              clock={clock}
              at={APART.at + i * APART.stagger}
              still={reducedMotion}
            />
          ))}
          {logoDots.map((dot) => (
            <ApartDot key={`${dot.cx},${dot.cy}`} dot={dot} clock={clock} still={reducedMotion} />
          ))}
        </Svg>
      </View>
      <Animated.Text style={[styles.tagline, taglineStyle]}>{t('tagline')}</Animated.Text>
    </Animated.View>
  );
}

type ApartProps = { clock: SharedValue<number>; still: boolean };

/** Retracts towards its end (top→bottom, left→right) while fading out. */
function ApartLine({ line, clock, at, still }: ApartProps & { line: LogoLine; at: number }) {
  const animatedProps = useAnimatedProps(() => {
    const p = still ? 0 : stepProgress(clock.get(), at, APART.duration);
    return { strokeDashoffset: -line.length * p, strokeOpacity: 1 - p };
  });
  return (
    <AnimatedPath
      d={line.d}
      stroke={LOGO_COLOR}
      strokeWidth={LOGO_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={[line.length, line.length]}
      animatedProps={animatedProps}
    />
  );
}

function ApartDot({ dot, clock, still }: ApartProps & { dot: LogoDot }) {
  const animatedProps = useAnimatedProps(() => {
    const p = still ? 0 : stepProgress(clock.get(), DOTS_AT, APART.duration);
    return { r: dot.r * (1 - 0.6 * p), fillOpacity: 1 - p };
  });
  return <AnimatedCircle cx={dot.cx} cy={dot.cy} fill={LOGO_COLOR} animatedProps={animatedProps} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
  },
  tagline: {
    position: 'absolute',
    top: '50%',
    left: 24,
    right: 24,
    marginTop: SPLASH_LOGO_HEIGHT / 2 + 28,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    color: colorOf('light', 'foreground'),
  },
});
