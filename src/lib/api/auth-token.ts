// 인증 토큰 저장소.
//
// 저장 전략: 인메모리 캐시 + expo-secure-store write-through.
// - 읽기(getAccessToken 등)는 인메모리에서 동기로 — client.ts가 매 요청마다 동기 접근하므로.
// - 쓰기(setTokens/clearTokens/setLoginProvider)는 인메모리 + SecureStore 양쪽에 반영.
// - 부팅 시 hydrate()로 SecureStore → 인메모리 로드 → 앱 재시작/리로드 후에도 세션 복원
//   (accessToken·refreshToken이 살아있어 재발급이 정상 동작. 인메모리만이던 이전엔 리로드마다 증발).
//
// SecureStore는 네이티브 모듈 → dev client를 리빌드해야 존재한다. 리빌드 전이면 모듈 로드
// 자체가 throw하므로 **정적 import는 못 쓴다**(throw가 import 시점이라 try/catch 밖 = 앱 크래시).
// lazy require로 감싸 최초 접근 때만 로드하고, 실패하면 인메모리로만 동작(과거 동작 안전 폴백).

type SecureStoreModule = typeof import('expo-secure-store');
// undefined=아직 미시도 / null=사용 불가(네이티브 모듈 없음) / 객체=사용 가능
let secureStore: SecureStoreModule | null | undefined;

function getSecureStore(): SecureStoreModule | null {
  if (secureStore !== undefined) return secureStore;
  try {
    // require를 try/catch로 감싸야 네이티브 모듈 부재 시 throw를 잡는다(정적 import는 불가).
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 지연 로드 필수(정적 import 불가)
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    secureStore = null; // 리빌드 전 — 인메모리 폴백
  }
  return secureStore;
}

const K_ACCESS = 'auth.accessToken';
const K_REFRESH = 'auth.refreshToken';
const K_PROVIDER = 'auth.loginProvider';

let accessToken: string | null = null;
let refreshToken: string | null = null;

// 로그인 시 사용자가 선택한 소셜 provider(KAKAO|NAVER|GOOGLE|APPLE).
// 서버 /users/me가 provider를 안 내려주므로 배지 표시용으로 로그인 시점에 저장한다.
// 서버가 provider를 응답에 추가하면 화면에서 서버값을 우선 쓰면 되고, 이 값은 폴백으로 남는다.
let loginProvider: string | null = null;

// ── SecureStore 안전 래퍼 (네이티브 모듈 부재 시 인메모리 폴백) ──────────
function secureGet(key: string): string | null {
  const ss = getSecureStore();
  if (!ss) return null;
  try {
    return ss.getItem(key);
  } catch {
    return null;
  }
}

function securePut(key: string, value: string | null): void {
  const ss = getSecureStore();
  if (!ss) return; // 네이티브 모듈 없음(리빌드 전) — 인메모리로만 동작.
  try {
    if (value == null) {
      // 동기 삭제 API가 없어 비동기로 지운다(실패해도 인메모리는 이미 갱신됨).
      void ss.deleteItemAsync(key).catch(() => {});
    } else {
      ss.setItem(key, value);
    }
  } catch {
    // 쓰기 실패 무시 — 인메모리는 이미 갱신됨.
  }
}

/** 부팅 시 1회 호출 — 저장된 토큰/ provider를 인메모리로 로드해 세션을 복원한다. */
export function hydrateTokens(): void {
  accessToken = secureGet(K_ACCESS);
  refreshToken = secureGet(K_REFRESH);
  loginProvider = secureGet(K_PROVIDER);
}

export function setLoginProvider(provider: string | null): void {
  loginProvider = provider;
  securePut(K_PROVIDER, provider);
}

export function getLoginProvider(): string | null {
  return loginProvider;
}

// 재발급까지 실패해 세션이 끝났을 때 호출할 콜백(루트에서 로그인 화면으로 보내는 용도).
// client.ts는 React 밖이라 네비게이션을 직접 못 하므로 콜백으로 위임한다.
let onAuthExpired: (() => void) | null = null;
let authExpiredEmitted = false;

export function setOnAuthExpired(cb: (() => void) | null): void {
  onAuthExpired = cb;
}

/** 재발급 실패 시 client.ts가 호출. 재로그인(setTokens) 전까지 한 번만 발화. */
export function emitAuthExpired(): void {
  if (authExpiredEmitted) return;
  authExpiredEmitted = true;
  onAuthExpired?.();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/** 로그인 성공 시 호출. accessToken은 필수, refreshToken은 있을 때만. */
export function setTokens(tokens: { accessToken: string; refreshToken?: string | null }): void {
  accessToken = tokens.accessToken;
  securePut(K_ACCESS, tokens.accessToken);
  if (tokens.refreshToken !== undefined) {
    refreshToken = tokens.refreshToken;
    securePut(K_REFRESH, tokens.refreshToken);
  }
  authExpiredEmitted = false; // 로그인/재발급 성공 → 다음 만료 때 다시 발화 가능
}

/** 로그아웃/탈퇴 시 호출. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  loginProvider = null;
  securePut(K_ACCESS, null);
  securePut(K_REFRESH, null);
  securePut(K_PROVIDER, null);
}
