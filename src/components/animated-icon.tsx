import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;
const MIN_SPLASH_MS = 1500;

interface SplashProps {
  onFinished?: () => void;
}

export function AnimatedSplashOverlay({ onFinished }: SplashProps) {
  const [visible, setVisible] = useState(true);
  // Track whether the minimum time has elapsed and whether the animation is done
  const minTimerDone = useRef(false);
  const animDone = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      minTimerDone.current = true;
      // If the animation already finished, now we can hide
      if (animDone.current) {
        setVisible(false);
        onFinished?.();
      }
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [onFinished]);

  const handleAnimFinished = () => {
    animDone.current = true;
    // Only hide once the minimum timer has also elapsed
    if (minTimerDone.current) {
      setVisible(false);
      onFinished?.();
    }
  };

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    70: { opacity: 1 },
    100: { opacity: 0 },
  });

  return (
    <Animated.View
      entering={splashKeyframe.duration(600).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(handleAnimFinished);
        }
      })}
      style={styles.backgroundSolidColor}
    >
      <Image
        source={require('@/assets/images/BizlinkLogo.png')}
        style={styles.splashLogo}
        contentFit="contain"
      />
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #A75BFF, #933EFF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#933EFF',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 140,
    height: 140,
    borderRadius: 28,
  },
});
