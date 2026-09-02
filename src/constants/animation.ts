// 리스트 항목 순차 등장(stagger) 파라미터. 접근성·성능을 위해 지연에 상한을 둔다.
export const STAGGER_STEP = 50; // 항목당 지연(ms)
export const STAGGER_MAX_STEPS = 8; // 이 개수 이후는 동일 지연(최대 400ms) — 무한정 늘어지지 않게

/**
 * index번째 항목의 등장 지연(ms). maxSteps에서 캡되어 긴 리스트도
 * 최대 STAGGER_MAX_STEPS*step(기본 400ms) 안에 전부 등장 시작한다.
 */
export function staggerDelay(
  index: number,
  step = STAGGER_STEP,
  maxSteps = STAGGER_MAX_STEPS,
): number {
  return Math.min(index, maxSteps) * step;
}
