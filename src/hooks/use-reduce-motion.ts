import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * OS "동작 줄이기(Reduce Motion)" 상태. 마운트 시 초기값을 즉시 조회하고
 * 변경 이벤트도 구독한다. (리스너만 달면 "이미 켠 채 콜드부트"한 사용자를 놓친다.)
 *
 * reanimated 선언형 애니메이션(entering/withSpring 등)은 ReduceMotion.System이
 * 자동 존중하므로 이 훅이 필요 없다. 네이티브 Stack 전환·withRepeat처럼
 * 자동 존중이 안 되는 곳에서만 이 값으로 수동 분기할 것.
 */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
