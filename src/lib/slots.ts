import type { MeResponse } from './api/types';

/**
 * 남은 별(레시피 저장 슬롯) = 슬롯 한도 − 등록된 레시피 수.
 *
 * 백엔드 `remainingRecipeSlots`가 이미 등록된 레시피를 반영하지 못하는 경우가 있어
 * (레시피 2개인데 remaining=한도 그대로), 화면에 실제 보이는 별(레시피) 수를 빼서
 * "별 N개 → 남은 별 그만큼 감소"가 항상 맞도록 계산한다. 음수는 0으로 clamp.
 *
 * @param me 프로필 응답(로딩 전이면 undefined → 0)
 * @param recipeCount 등록된 레시피 총 개수(목록의 totalCount)
 */
export function remainingSlots(me: MeResponse | undefined, recipeCount: number): number {
  if (!me) return 0;
  return Math.max(0, me.recipeSlotLimit - recipeCount);
}

/**
 * 게스트(비로그인) 저장 한도. 5개 도달 시 로그인을 유도한다.
 * 로그인하면 백엔드 `recipeSlotLimit`(광고로 확장 가능) 기준으로 전환된다.
 */
export const GUEST_SLOT_LIMIT = 5;

/** 게스트 남은 슬롯 = 한도(5) − 로컬 레시피 수. 음수는 0으로 clamp. */
export function guestRemainingSlots(recipeCount: number): number {
  return Math.max(0, GUEST_SLOT_LIMIT - recipeCount);
}
