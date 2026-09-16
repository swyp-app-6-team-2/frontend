// FCM 푸시 — 권한 요청 → 토큰 획득 → 백엔드 등록(PUT /push-tokens) + 알림 탭 딥링크.
//
// @react-native-firebase/messaging(v22+ 모듈러 API)은 네이티브 모듈 → dev client를 리빌드해야
// 존재한다. 리빌드 전이면 모듈 로드가 throw하므로 lazy require + try/catch로 격리한다(실패 시
// 조용히 폴백 = 알림만 안 올 뿐 앱은 정상). [[native-module-needs-rebuild]] 패턴.
//
// iOS도 FCM 토큰을 쓴다(백엔드 계약). getToken 전에 APNs 등록이 선행돼야 한다.

import { Platform } from 'react-native';

import { notificationApi } from '@/lib/api';

type MessagingApi = typeof import('@react-native-firebase/messaging');
// undefined=미시도 / null=사용 불가(네이티브 모듈 없음) / 객체=사용 가능
let api: MessagingApi | null | undefined;

function getApi(): MessagingApi | null {
  if (api !== undefined) return api;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 지연 로드 필수(정적 import 불가)
    api = require('@react-native-firebase/messaging') as MessagingApi;
  } catch {
    api = null; // 리빌드 전 — 폴백
  }
  return api;
}

const PLATFORM = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

async function sendToken(token: string): Promise<void> {
  try {
    await notificationApi.registerPushToken({ token, platform: PLATFORM });
  } catch {
    // 네트워크/인증 실패 — 다음 갱신/재시작 때 다시 등록 시도됨.
  }
}

/**
 * 권한 요청 → FCM 토큰 → 백엔드 등록. 로그인 성공 후 / 앱 시작(세션 있음) 시 호출한다.
 * 권한 거부·토큰 실패·모듈 부재 시 조용히 반환(앱 흐름 방해 없음).
 */
export async function registerPushToken(): Promise<void> {
  const m = getApi();
  if (!m) return;
  try {
    const messaging = m.getMessaging();
    const status = await m.requestPermission(messaging);
    if (
      status !== m.AuthorizationStatus.AUTHORIZED &&
      status !== m.AuthorizationStatus.PROVISIONAL
    ) {
      return;
    }
    // iOS: APNs 등록이 선행돼야 getToken이 성공한다.
    if (Platform.OS === 'ios') await m.registerDeviceForRemoteMessages(messaging);
    const token = await m.getToken(messaging);
    if (token) await sendToken(token);
  } catch {
    // 조용히 폴백.
  }
}

/** 토큰 갱신 구독 → 갱신될 때마다 재등록. 반환 unsubscribe는 앱 생명주기 동안 유지. */
export function subscribeTokenRefresh(): () => void {
  const m = getApi();
  if (!m) return () => {};
  try {
    return m.onTokenRefresh(m.getMessaging(), (token: string) => void sendToken(token));
  } catch {
    return () => {};
  }
}

/**
 * 알림 탭 시 콜백 실행(호출부에서 홈으로 라우팅 — 딥링크 계약 orca:///home).
 * 백그라운드에서 탭(onNotificationOpenedApp) + 종료 상태에서 탭(getInitialNotification) 모두 처리.
 */
export function subscribeNotificationOpen(onOpen: () => void): () => void {
  const m = getApi();
  if (!m) return () => {};
  try {
    const messaging = m.getMessaging();
    // 종료 상태에서 알림 탭으로 실행된 경우.
    void m
      .getInitialNotification(messaging)
      .then((msg) => {
        if (msg) onOpen();
      })
      .catch(() => {});
    // 백그라운드에서 알림 탭.
    return m.onNotificationOpenedApp(messaging, () => onOpen());
  } catch {
    return () => {};
  }
}

// 백그라운드 데이터 메시지 핸들러 — RNFirebase가 없으면 경고를 낸다. 표시는 OS가 처리하므로
// 최소 핸들러만 등록(모듈 로드 시 1회). 미리빌드 전이면 getApi()가 null이라 스킵.
(() => {
  const m = getApi();
  if (!m) return;
  try {
    m.setBackgroundMessageHandler(m.getMessaging(), async () => {});
  } catch {
    // 폴백.
  }
})();
