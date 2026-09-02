import { useEffect, useState } from 'react';

// 세션 동안 화면별로 "최초 1회만" 등장 애니메이션을 재생하기 위한 게이트.
// 스택 화면은 뒤로 갔다 재진입하면 리마운트되는데, 매번 stagger가 재생되면
// 오히려 거슬린다 → 이미 본 화면 key는 여기 담아 두 번째부터 스킵.
// (모듈 스코프라 앱 재시작 시 초기화 — "세션당 1회"가 의도.)
const seen = new Set<string>();

/** 이 key의 화면을 이번 세션에서 처음 마운트하는가? (등장 애니메이션 재생 여부) */
export function useEnteringOnce(key: string): boolean {
  // 초기화 함수는 마운트 시 1회만 실행 → 이때의 seen 상태로 결정을 고정.
  const [first] = useState(() => !seen.has(key));
  useEffect(() => {
    seen.add(key);
  }, [key]);
  return first;
}
