import { useSyncExternalStore } from 'react';

// 광고 시청 → 슬롯 확장 상태(세션 메모리).
// ⚠️ 실제 "하루 N회 / 다음날 리셋"은 백엔드나 저장소(날짜 기록)가 필요하다.
// 지금은 광고 SDK·백엔드 연동 전이라 앱 세션 동안만 카운트를 유지한다.
const DAILY_LIMIT = 3;

let watchedToday = 0;
let justAdded = false; // 방금 슬롯이 추가됨 → 홈에서 성공 팝업 노출용
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function canWatchAd(): boolean {
  return watchedToday < DAILY_LIMIT;
}

/** 광고 1회 시청 완료 → 슬롯 +2, 성공 팝업 예약. */
export function watchAd() {
  if (watchedToday >= DAILY_LIMIT) return;
  watchedToday += 1;
  justAdded = true;
  emit();
}

/** 홈에서 성공 팝업을 닫을 때 호출. */
export function dismissSlotAdded() {
  if (!justAdded) return;
  justAdded = false;
  emit();
}

/** 오늘 광고를 더 볼 수 있는지 구독. */
export function useCanWatchAd(): boolean {
  return useSyncExternalStore(subscribe, canWatchAd, canWatchAd);
}

/** 방금 슬롯이 추가됐는지 구독(홈 팝업). */
export function useSlotJustAdded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => justAdded,
    () => justAdded,
  );
}
