// Amplitude 제품 분석 — HTTP API(/2/httpapi) 직접 전송.
// ⚠️ 순수 JS(네이티브 모듈 없음)라 EAS Update(OTA)로도 배포 가능. device_id는 이미 번들에 있는
//    expo-secure-store에 영속화한다(새 네이티브 의존 없음). 키 없거나 네트워크 실패는 조용히 무시.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getItemAsync, setItemAsync } from 'expo-secure-store';

const API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
const ENDPOINT = 'https://api2.amplitude.com/2/httpapi';
const DEVICE_ID_KEY = 'amplitude_device_id';
const FLUSH_DELAY_MS = 5000; // 이벤트를 모아 5초마다 전송(네트워크 절약)
const MAX_QUEUE = 500; // 오프라인 누적 상한(초과분은 오래된 것부터 버림)

type AmpEvent = {
  event_type: string;
  time: number;
  session_id: number;
  event_properties?: Record<string, unknown>;
};

let deviceId: string | null = null;
let userId: string | null = null;
let sessionId = 0;
let started = false;
let queue: AmpEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// 익명 설치 식별자(광고/추적 ID 아님). 저장소에 영속해 기기별 세션·리텐션을 잇는다.
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** 앱 시작 시 1회. 키 없으면 no-op. device_id를 비동기 로드 후 첫 전송을 트리거. */
export function initAnalytics(): void {
  if (started || !API_KEY) return;
  started = true;
  sessionId = Date.now();
  void (async () => {
    try {
      let id = await getItemAsync(DEVICE_ID_KEY);
      if (!id) {
        id = uuid();
        await setItemAsync(DEVICE_ID_KEY, id);
      }
      deviceId = id;
    } catch {
      deviceId = deviceId ?? uuid(); // 저장소 실패 시 세션 한정 ID로라도 동작
    }
    void flush(); // 로드 전 쌓인 이벤트 전송
  })();
}

/** 임의 이벤트 기록. 초기화 전/키 없음이면 무시. */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!started || !API_KEY) return;
  queue.push({
    event_type: name,
    time: Date.now(),
    session_id: sessionId,
    event_properties: props,
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  scheduleFlush();
}

/** 화면 조회 — 이탈율/퍼널의 핵심 신호. 라우트 경로를 screen 속성으로 싣는다. */
export function trackScreen(name: string): void {
  trackEvent('Screen Viewed', { screen: name });
}

/** 로그인 사용자 식별 — 이후 이벤트에 user_id를 실어 기기 넘어 사용자 단위로 집계. 로그아웃 시 null. */
export function setAnalyticsUser(id: string | null): void {
  userId = id;
}

function scheduleFlush(): void {
  if (flushTimer || !deviceId) return; // device_id 준비 전엔 큐에만 쌓고 init이 flush
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  if (!API_KEY || !deviceId || queue.length === 0) return;
  const batch = queue.splice(0, 100); // HTTP API는 요청당 최대 2000, 넉넉히 100씩
  const events = batch.map((e) => ({
    ...e,
    device_id: deviceId,
    user_id: userId ?? undefined, // 로그인 사용자면 동봉(없으면 익명 device_id만)
    platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
    app_version: Constants.expoConfig?.version,
  }));
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY, events }),
    });
    if (!res.ok) queue.unshift(...batch); // 서버 오류 → 재큐(다음 기회에 재전송)
  } catch {
    queue.unshift(...batch); // 네트워크 실패 → 재큐
  }
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
}
