import * as Haptics from 'expo-haptics';

/** 촉각 피드백 종류 — 토글/선택은 selection, CTA는 light, 결과 알림은 success/warning/error. */
export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error';

// fire-and-forget. 실패(미지원 기기·네이티브 모듈 미탑재 dev client 등)해도 UX에
// 영향 없게 완전히 삼킨다. 동기 throw(모듈 부재)와 promise reject 둘 다 방어.
// 시뮬레이터에선 물리 피드백이 없지만 호출 자체는 안전(실기기에서만 체감).
function safe(run: () => Promise<unknown>): void {
  try {
    void run().catch(() => {});
  } catch {
    // 네이티브 모듈이 없는 빌드 등 — 무시.
  }
}

export function fireHaptic(kind: HapticKind): void {
  switch (kind) {
    case 'selection':
      return safe(() => Haptics.selectionAsync());
    case 'light':
      return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    case 'medium':
      return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    case 'success':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    case 'warning':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
    case 'error':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }
}
