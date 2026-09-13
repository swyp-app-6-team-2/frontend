import { useSyncExternalStore } from 'react';

// 내가 담은 재료 id 집합(세션 메모리). 백엔드 '내 재료 저장' API가 생기면
// 이 모듈을 서버 상태로 교체하고, 화면은 useMyIngredientIds/addMyIngredients만 그대로 쓴다.
let ids = new Set<number>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** 선택한 재료들을 내 재료에 추가. */
export function addMyIngredients(newIds: number[]) {
  const next = new Set(ids);
  newIds.forEach((id) => next.add(id));
  ids = next;
  emit();
}

/** 내 재료에서 제거. */
export function removeMyIngredient(id: number) {
  if (!ids.has(id)) return;
  const next = new Set(ids);
  next.delete(id);
  ids = next;
  emit();
}

/** 내 재료 id 집합 구독. */
export function useMyIngredientIds(): Set<number> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => ids,
    () => ids,
  );
}
