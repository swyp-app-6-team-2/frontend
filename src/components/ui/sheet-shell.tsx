import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/use-reduce-motion';

// 시트를 화면 아래로 완전히 밀어내는 거리(px) — 닫힘 슬라이드용.
const OFFSCREEN = 700;

export type SheetShellProps = {
  onCancel: () => void;
  onConfirm?: () => void;
  /** true면 하단 취소/확인 버튼을 숨긴다(항목 탭 = 즉시 적용 시트용). */
  hideActions?: boolean;
  /** ReactNode, 또는 애니메이션 닫힘 콜백을 받는 함수(항목 탭 시 close(적용)로 슬라이드 후 적용). */
  children: ReactNode | ((close: (done: () => void) => void) => ReactNode);
};

// 하단 시트 껍데기 — 위로 스르륵 등장, 닫을 땐 아래로 스르륵 하강 후 unmount.
// (Modal이 즉시 닫히면 exit이 안 보여서, shared value로 enter/exit을 직접 제어)
export function SheetShell({ onCancel, onConfirm, hideActions, children }: SheetShellProps) {
  const reduceMotion = useReduceMotion();
  const ty = useSharedValue(reduceMotion ? 0 : OFFSCREEN);
  const op = useSharedValue(reduceMotion ? 1 : 0);
  const [closing, setClosing] = useState(false);
  // 닫힘 애니메이션이 끝난 뒤 실행할 동작(취소/적용). ref 대신 state — render 중 ref 접근 회피.
  const [pending, setPending] = useState<{ done: () => void } | null>(null);

  // 등장/닫힘을 한 이펙트로(단일 writer — react-compiler가 op/ty 재대입을 막는 걸 회피).
  // closing=false → 위로 스르륵 등장, true → 아래로 스르륵 하강 후 실제 unmount.
  useEffect(() => {
    if (reduceMotion) {
      ty.value = closing ? OFFSCREEN : 0;
      op.value = closing ? 0 : 1;
      if (closing) pending?.done();
      return;
    }
    if (closing) {
      op.value = withTiming(0, { duration: 220 });
      ty.value = withTiming(OFFSCREEN, { duration: 260, easing: Easing.in(Easing.cubic) });
      const done = pending?.done;
      const t = setTimeout(() => done?.(), 280);
      return () => clearTimeout(t);
    }
    op.value = withTiming(1, { duration: 200 });
    ty.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [closing, pending, reduceMotion, op, ty]);

  const requestClose = (done: () => void) => {
    setPending({ done });
    setClosing(true);
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: op.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => requestClose(onCancel)}
    >
      <View className="flex-1">
        <Animated.View style={overlayStyle} className="flex-1 bg-background/85">
          <Pressable
            className="flex-1"
            onPress={() => requestClose(onCancel)}
            accessibilityLabel="닫기"
          />
        </Animated.View>
        <Animated.View
          style={sheetStyle}
          className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-field"
        >
          <View className="px-screen pt-6">
            {typeof children === 'function' ? children(requestClose) : children}
          </View>
          {hideActions ? (
            <View className="pb-8" />
          ) : (
            <View className="flex-row gap-3 px-screen pb-8 pt-4">
              <Pressable
                onPress={() => requestClose(onCancel)}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-pill bg-popup-button active:opacity-80"
              >
                <Text className="text-[16px] font-semibold text-popup-button-text">취소</Text>
              </Pressable>
              <Pressable
                onPress={() => requestClose(onConfirm ?? onCancel)}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-pill bg-primary active:opacity-90"
              >
                <Text className="text-[16px] font-semibold text-ink">확인</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
