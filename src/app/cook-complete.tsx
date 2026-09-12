import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { fireHaptic } from '@/lib/haptics';

// 별 주변으로 퍼지는 반짝임 — 중앙 기준 오프셋(px)과 크기.
const SPARKLES = [
  { dx: -96, dy: -72, size: 20 },
  { dx: 96, dy: -88, size: 26 },
  { dx: 124, dy: 4, size: 15 },
  { dx: -122, dy: 22, size: 16 },
  { dx: -72, dy: 96, size: 22 },
  { dx: 84, dy: 98, size: 18 },
];

// 점등 시 중앙에서 바깥으로 퍼지며 나타나는 반짝이(✦).
function Sparkle({
  burst,
  dx,
  dy,
  size,
}: {
  burst: SharedValue<number>;
  dx: number;
  dy: number;
  size: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [
      { translateX: dx * burst.value },
      { translateY: dy * burst.value },
      { scale: 0.4 + 0.7 * burst.value },
    ],
  }));
  return (
    <Animated.Text
      style={[{ position: 'absolute', fontSize: size, color: palette.primary }, style]}
    >
      ✦
    </Animated.Text>
  );
}

// 별 뒤 은은한 후광 — 동심원 여러 겹으로 radial glow 흉내(블러 없이).
function GlowRing({
  glow,
  size,
  opacity,
}: {
  glow: SharedValue<number>;
  size: number;
  opacity: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity * (0.6 + glow.value * 0.6),
    transform: [{ scale: 0.9 + glow.value * 0.3 }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.primary,
        },
        style,
      ]}
    />
  );
}

// 22 요리 완료 — 별에 불이 켜지는 게이미피케이션(앱 정체성).
// 기록 생성은 상세 화면에서 처리되고, 여기선 점등 연출 + 축하만.
export default function CookCompleteScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();
  const reduceMotion = useReduceMotion();

  const burst = useSharedValue(0); // 반짝임 확산(0→1)
  const glow = useSharedValue(0.5); // 후광 맥동(0.5↔1)

  useEffect(() => {
    fireHaptic('success');
    if (reduceMotion) {
      // 동작 줄이기 — 애니메이션 없이 최종 상태로.
      burst.value = 1;
      glow.value = 0.75;
      return;
    }
    burst.value = withDelay(
      150,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    glow.value = withDelay(
      450,
      withRepeat(
        withSequence(withTiming(1, { duration: 950 }), withTiming(0.5, { duration: 950 })),
        -1,
        true,
      ),
    );
  }, [reduceMotion, burst, glow]);

  return (
    <View className="flex-1 bg-background">
      {/* 구름 배경 + 바닥 돔 + 캐릭터 — 홈과 동일 비주얼 */}
      <View pointerEvents="none" className="absolute inset-0">
        <Image
          source={require('../assets/images/sky-bg.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <Image
          source={require('../assets/images/notify-bottom.png')}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            aspectRatio: 402 / 257,
          }}
          contentFit="cover"
        />
        <Image
          source={require('../assets/images/mascot-blob.png')}
          style={{ position: 'absolute', left: '14%', bottom: 138, width: 110, height: 110 }}
          contentFit="contain"
        />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center" pointerEvents="none">
          {/* 별 점등 */}
          <View className="items-center justify-center">
            <GlowRing glow={glow} size={232} opacity={0.06} />
            <GlowRing glow={glow} size={168} opacity={0.1} />
            <GlowRing glow={glow} size={120} opacity={0.16} />
            {SPARKLES.map((s, i) => (
              <Sparkle key={i} burst={burst} dx={s.dx} dy={s.dy} size={s.size} />
            ))}
            <Animated.Text
              entering={ZoomIn.springify().damping(8).mass(0.7)}
              style={{
                fontSize: 128,
                lineHeight: 140,
                textAlign: 'center',
                color: palette.primary,
                textShadowColor: palette.primary,
                textShadowRadius: 28,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              ★
            </Animated.Text>
          </View>

          {/* 문구 */}
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            className="mt-12 items-center gap-2 px-screen"
          >
            <AppText variant="title" className="text-center text-primary">
              별에 불이 켜졌어요!
            </AppText>
            {title ? (
              <AppText variant="subheading" className="text-center">
                {title}
              </AppText>
            ) : null}
            <AppText variant="body" className="text-center text-muted">
              방금 요리 완료 기록이 저장됐어요
            </AppText>
          </Animated.View>
        </View>

        {/* 홈으로 */}
        <Animated.View entering={FadeIn.delay(700)} className="px-screen pb-6">
          <Button label="홈으로 가기" onPress={() => router.replace('/home')} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
