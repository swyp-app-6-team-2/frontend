import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  // 네이티브 스플래시 숨김 + 페이드 시작을 마운트 직후 확정 실행 — View onLayout 타이밍에 의존하지
  // 않는다(home처럼 무거운 화면이 초기 레이아웃을 막으면 onLayout이 지연·누락돼 스플래시가 안 꺼졌다).
  useEffect(() => {
    let alive = true;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        if (alive) setAnimate(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 안전장치: 페이드 애니메이션의 withCallback(finished)이 릴리스 빌드·reduce-motion에서
  // 안 불려 오버레이가 남아(전체화면·zIndex 1000) 앱 전체를 가리거나 터치를 삼키던 버그 방지.
  // 페이드 시작 후 일정 시간이 지나면 콜백과 무관하게 강제 언마운트한다.
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setVisible(false), DURATION + 500);
    return () => clearTimeout(t);
  }, [animate]);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = (
    <Image
      style={styles.splashImage}
      contentFit="cover"
      source={require('@/assets/images/splash.png')}
    />
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
      pointerEvents="none"
    >
      {image}
    </Animated.View>
  ) : (
    <View style={styles.splashOverlay} pointerEvents="none">
      {image}
    </View>
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
    width: 76,
    height: 71,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#070C22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
