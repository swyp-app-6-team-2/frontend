// 홈 화면 추천 모드(랜덤/내재료) 선택값 — 세션 메모리.
// 탭 전환은 최상위 라우트를 Link push로 교체해 home 컴포넌트를 언마운트하지만, 이 모듈은
// 언로드되지 않으므로 다시 들어와도 마지막 선택이 유지된다(요구사항: 탭 바꿨다 와도 값 유지).
// 앱을 완전히 종료·재시작하면 모듈이 재로딩되어 null→fallback 기본값으로 돌아간다.
// 값 변경은 이 모듈 함수 안에서만 하므로 React Compiler의 immutability 규칙에 걸리지 않는다.
let mode: string | null = null;

/** 홈 드롭다운에서 추천 모드를 고를 때 호출 — 세션 동안 보관한다. */
export function setRecommendMode(label: string) {
  mode = label;
}

/** 저장된 모드(없으면 fallback). 홈 마운트 시 초기값 복원에 쓴다. */
export function getRecommendMode(fallback: string): string {
  return mode ?? fallback;
}
