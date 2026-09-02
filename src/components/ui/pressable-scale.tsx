import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/hooks/use-press-scale';
import type { HapticKind } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  /** 시각 스타일 — 내부 View에 적용(애니메이션 transform과 분리해 NativeWind 충돌 회피). */
  className?: string;
  /** 눌림 축소 배율. 기본 0.96. 넓은 행은 0.98 권장. */
  scaleTo?: number;
  /** 누를 때 촉각 피드백. */
  haptic?: HapticKind;
};

/**
 * Button과 동일한 press-scale을 어디서나 쓰기 위한 프리미티브.
 * 애니메이션 transform은 AnimatedPressable에, 시각 스타일(className)은 자식 View에
 * 분리한다 — CLAUDE.md가 경고한 NativeWind className↔reanimated style 충돌 방지.
 */
export function PressableScale({
  children,
  className,
  scaleTo,
  haptic,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const press = usePressScale({ scaleTo, haptic });
  return (
    <AnimatedPressable
      style={press.animatedStyle}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <View className={className}>{children}</View>
    </AnimatedPressable>
  );
}
