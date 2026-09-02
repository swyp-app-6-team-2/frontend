import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { fireHaptic, type HapticKind } from '@/lib/haptics';

export type UsePressScaleOptions = {
  /** 눌렀을 때 축소 배율. 기본 0.96 (넓은 행은 0.98 권장). */
  scaleTo?: number;
  /** 누를 때 촉각 피드백. 없으면 무음. */
  haptic?: HapticKind;
};

/**
 * Button/PressableScale 공통 press-scale. reanimated shared value로 눌림 축소 →
 * 스프링 복귀. reduce-motion은 reanimated 기본값(ReduceMotion.System)이 자동 존중.
 * animatedStyle은 Animated 노드에만 얹고, 시각 스타일(className)은 자식에 분리할 것.
 */
export function usePressScale(opts?: UsePressScaleOptions) {
  const scale = useSharedValue(1);
  // .get()/.set() (Reanimated 4) — `.value =`는 React Compiler 불변성 린트에 걸린다.
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const onPressIn = () => {
    scale.set(withTiming(opts?.scaleTo ?? 0.96, { duration: 90 }));
    if (opts?.haptic) fireHaptic(opts.haptic);
  };
  const onPressOut = () => {
    scale.set(withSpring(1, { damping: 12, stiffness: 260, mass: 0.6 }));
  };

  return { animatedStyle, onPressIn, onPressOut };
}
