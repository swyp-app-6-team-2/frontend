// 인증 토큰 저장소.
//
// 지금은 인메모리(JS 전용, 네이티브 리빌드 불필요). 앱을 껐다 켜면 사라지므로
// "로그인 유지"가 필요해지면 expo-secure-store로 교체한다(네이티브 모듈 → dev client 재빌드).
// 교체해도 이 모듈의 get/set 인터페이스만 유지하면 client.ts는 그대로 동작한다.

let accessToken: string | null = null;
let refreshToken: string | null = null;

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
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken;
  authExpiredEmitted = false; // 로그인/재발급 성공 → 다음 만료 때 다시 발화 가능
}

/** 로그아웃/탈퇴 시 호출. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}
